package controller

import (
	"myapp/utils/auth"
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireUser ensures a valid user session cookie is present.
func RequireUser(c *gin.Context) {
	token, err := c.Cookie(sessionCookie)
	if err != nil || token == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	claims, err := auth.ParseToken(token)
	if err != nil || claims.Role != "user" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "session invalid"})
		return
	}
	c.Set("email", claims.Email)
	c.Next()
}

// RequireAdmin ensures a valid admin session cookie is present.
func RequireAdmin(c *gin.Context) {
	token, err := c.Cookie(adminSessionCookie)
	if err != nil || token == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	claims, err := auth.ParseToken(token)
	if err != nil || claims.Role != "admin" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "session invalid"})
		return
	}
	c.Set("email", claims.Email)
	c.Next()
}
