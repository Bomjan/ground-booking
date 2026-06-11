package routes

import (
	"log"
	"myapp/controller"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func Router() {
	router := gin.Default()

	frontendOrigin := os.Getenv("FRONTEND_ORIGIN")
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:3000"
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// User auth
	router.POST("/user/add", controller.Adduser)
	router.POST("/user/login", controller.LoginUser)
	router.POST("/user/logout", controller.LogoutUser)
	router.GET("/user/me", controller.GetMe)

	// Admin auth
	router.POST("/admin/login", controller.AdminLogin)
	router.POST("/admin/logout", controller.AdminLogout)
	router.GET("/admin/me", controller.RequireAdmin, controller.AdminMe)

	// Admin user management
	router.GET("/admin/users", controller.RequireAdmin, controller.GetAllUsers)
	router.DELETE("/admin/users/:id", controller.RequireAdmin, controller.DeleteUser)

	// Profile details
	router.GET("/profile/me", controller.RequireUser, controller.GetMyProfile)
	router.POST("/add/details", controller.RequireUser, controller.AddDetails)
	router.PUT("/update/:email", controller.RequireUser, controller.UpdateDetails)

	// Slots
	router.GET("/api/slots", controller.GetSlots)

	// Bookings
	router.POST("/booking", controller.RequireUser, controller.CreateBooking)
	router.GET("/my-bookings", controller.RequireUser, controller.GetMyBookings)
	router.GET("/bookings", controller.RequireAdmin, controller.GetAllBookings)
	router.GET("/bookings/date/:date", controller.GetBookingsByDate)
	router.GET("/bookings/date/:date/all", controller.GetActiveBookingsByDate)
	router.GET("/booking/:id", controller.GetBookingByID)
	router.PUT("/booking/:id", controller.RequireUser, controller.UpdateBooking)
	router.DELETE("/booking/:id", controller.RequireUser, controller.DeleteBooking)
	router.PUT("/booking/:id/approve", controller.RequireAdmin, controller.ApproveBooking)
	router.PUT("/booking/:id/reject", controller.RequireAdmin, controller.RejectBooking)
	router.PUT("/booking/:id/request-cancel", controller.RequireUser, controller.RequestCancelBooking)
	router.PUT("/booking/:id/approve-cancel", controller.RequireAdmin, controller.ApproveCancelBooking)
	router.PUT("/booking/:id/deny-cancel", controller.RequireAdmin, controller.DenyCancelBooking)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Listening on port", port)
	log.Fatal(router.Run(":" + port))
}
