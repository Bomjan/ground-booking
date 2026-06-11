package controller

import (
	"myapp/model"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CreateBooking(c *gin.Context) {
	var b model.Booking
	if err := c.ShouldBindJSON(&b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON body"})
		return
	}

	if err := b.CreateBooking(); err != nil {
		switch err {
		case model.ErrInvalidTime:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time range: end must be after start"})
		case model.ErrDurationExceeded:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Booking duration cannot exceed 1.5 hours"})
		case model.ErrSlotBooked:
			c.JSON(http.StatusConflict, gin.H{"error": "This time slot is already booked or approved"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Booking submitted and awaiting admin approval"})
}

// GetMyBookings returns only the authenticated user's own bookings.
func GetMyBookings(c *gin.Context) {
	email, _ := c.Get("email")
	bookings, err := model.GetBookingsByStudentID(email.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if bookings == nil {
		bookings = []model.Booking{}
	}
	c.JSON(http.StatusOK, bookings)
}

func GetAllBookings(c *gin.Context) {
	bookings, err := model.GetAllBookings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if bookings == nil {
		bookings = []model.Booking{}
	}
	c.JSON(http.StatusOK, bookings)
}

func GetBookingByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	b, err := model.GetBookingByID(id)
	if err == model.ErrNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, b)
}

func UpdateBooking(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	var b model.Booking
	if err := c.ShouldBindJSON(&b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON body"})
		return
	}

	if err := b.UpdateBooking(id); err != nil {
		switch err {
		case model.ErrSlotBooked:
			c.JSON(http.StatusConflict, gin.H{"error": "Slot already booked"})
		case model.ErrNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Booking updated"})
}

func DeleteBooking(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := model.DeleteBooking(id); err != nil {
		if err == model.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Booking deleted"})
}

// ApproveBooking approves a booking and auto-rejects any conflicting pending bookings.
func ApproveBooking(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	rejected, err := model.ApproveBookingAndRejectConflicts(id)
	if err != nil {
		switch err {
		case model.ErrNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found or not in pending state"})
		case model.ErrSlotBooked:
			c.JSON(http.StatusConflict, gin.H{"error": "Another booking is already approved for this slot"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":       "Booking approved",
		"auto_rejected": rejected,
	})
}

func RejectBooking(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := model.UpdateBookingStatus(id, "rejected"); err != nil {
		if err == model.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Booking rejected"})
}

// RequestCancelBooking lets a user request cancellation of an approved booking.
func RequestCancelBooking(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := model.RequestCancelBooking(id); err != nil {
		if err == model.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found or not in approved state"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cancellation request submitted"})
}

// ApproveCancelBooking confirms a user's cancellation request, freeing the slot.
func ApproveCancelBooking(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := model.UpdateBookingStatus(id, "cancelled"); err != nil {
		if err == model.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cancellation approved — slot is now available"})
}

// DenyCancelBooking rejects a cancellation request and restores the booking to approved.
func DenyCancelBooking(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := model.UpdateBookingStatus(id, "approved"); err != nil {
		if err == model.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cancellation request denied"})
}

func GetBookingsByDate(c *gin.Context) {
	date := c.Param("date")
	bookings, err := model.GetApprovedBookingsByDate(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if bookings == nil {
		bookings = []model.Booking{}
	}
	c.JSON(http.StatusOK, bookings)
}

// GetActiveBookingsByDate returns approved + pending + cancel_requested for the HUD.
func GetActiveBookingsByDate(c *gin.Context) {
	date := c.Param("date")
	bookings, err := model.GetActiveBookingsByDate(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if bookings == nil {
		bookings = []model.Booking{}
	}
	c.JSON(http.StatusOK, bookings)
}
