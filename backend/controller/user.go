package controller

import (
	"myapp/model"
	"myapp/utils/auth"
	"net/http"

	"github.com/gin-gonic/gin"
)

const sessionCookie = "session"

func setSessionCookie(c *gin.Context, token string, maxAge int) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(sessionCookie, token, maxAge, "/", "", false, true)
}

func Adduser(c *gin.Context) {
	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON Body"})
		return
	}

	if err := user.Signup(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"status": "User registered. Awaiting admin approval.",
	})
}

func LoginUser(c *gin.Context) {
	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON Body"})
		return
	}

	if err := user.Login(); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := auth.GenerateToken(user.Email, "user")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create session"})
		return
	}
	setSessionCookie(c, token, 86400*7)

	c.JSON(http.StatusOK, gin.H{
		"message": "login success",
		"user":    user,
	})
}

func GetMe(c *gin.Context) {
	token, err := c.Cookie(sessionCookie)
	if err != nil || token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	claims, err := auth.ParseToken(token)
	if err != nil || claims.Role != "user" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "session invalid"})
		return
	}
	user, err := model.GetUserByEmail(claims.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "session invalid"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func LogoutUser(c *gin.Context) {
	setSessionCookie(c, "", -1)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}
