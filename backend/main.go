package main

import (
	"log"
	"myapp/datastore/postgres"
	"myapp/routes"
)

func main() {
	postgres.Connect()
	log.Println("Server starting on :8080")
	routes.Router()
}
