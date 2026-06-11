package model

import (
	"errors"
	"myapp/datastore/postgres"
	"myapp/utils/auth"
)

type Admin struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (a *Admin) Login() error {
	var dbAdmin Admin

	err := postgres.Db.QueryRow(
		`SELECT id, email, password FROM admins WHERE email=$1`, a.Email,
	).Scan(&dbAdmin.ID, &dbAdmin.Email, &dbAdmin.Password)

	if err != nil {
		return errors.New("admin not found")
	}

	if !auth.CheckPassword(dbAdmin.Password, a.Password) {
		return errors.New("invalid password")
	}

	dbAdmin.Password = ""
	*a = dbAdmin
	return nil
}
