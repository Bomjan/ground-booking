package controller

import (
	"myapp/model"
	"myapp/utils/auth"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

const adminSessionCookie = "admin_session"

func AdminLogin(c *gin.Context) {
	var admin model.Admin
	if err := c.ShouldBindJSON(&admin); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON Body"})
		return
	}

	if err := admin.Login(); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	token, err := auth.GenerateToken(admin.Email, "admin")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create session"})
		return
	}
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(adminSessionCookie, token, 86400*7, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "admin login success",
		"admin":   admin,
	})
}

func AdminMe(c *gin.Context) {
	email, _ := c.Get("email")
	c.JSON(http.StatusOK, gin.H{"email": email})
}

func AdminLogout(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(adminSessionCookie, "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

func GetAllUsers(c *gin.Context) {
	users, err := model.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if users == nil {
		users = []model.User{}
	}
	c.JSON(http.StatusOK, users)
}

func DeleteUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := model.DeleteUser(id); err != nil {
		if err == model.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}
