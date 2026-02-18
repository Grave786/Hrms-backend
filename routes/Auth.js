const express = require('express');
const { login, logout } = require('../controllers/AuthController');
const AuthRoutes = express.Router();

AuthRoutes.post('/login', login)
AuthRoutes.post('/logout', logout)

module.exports = AuthRoutes