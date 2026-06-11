package controller

import (
	"myapp/model"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetMyProfile(c *gin.Context) {
	email, _ := c.Get("email")
	p, err := model.GetProfileByEmail(email.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "profile not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func AddDetails(c *gin.Context) {
	var p model.Profile
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON body"})
		return
	}

	if p.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	if err := p.Add(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Profile details saved"})
}

func UpdateDetails(c *gin.Context) {
	email := c.Param("email")
	var p model.Profile
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON body"})
		return
	}

	if err := p.Update(email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Profile updated"})
}

func GetSlots(c *gin.Context) {
	slots, err := model.GetAllSlots()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if slots == nil {
		slots = []model.Slot{}
	}
	c.JSON(http.StatusOK, slots)
}
