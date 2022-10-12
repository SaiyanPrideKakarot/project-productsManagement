const express = require('express')
const router = express.Router()

const UserController = require('../controllers/userController')

router.post('/register', UserController.createUser)
router.post('/login', UserController.loginUser)
router.put('/user/:userId/profile', UserController.updateAPI)

module.exports = router