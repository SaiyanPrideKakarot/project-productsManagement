const express = require('express')
const router = express.Router()

const UserController = require('../controllers/userController')
const {authentication, authorization} = require('../middlewares/auth')

router.post('/register', UserController.createUser)
router.post('/login', UserController.loginUser)
router.get('/user/:userId/profile', authentication, UserController.getUserProfile)
router.put('/user/:userId/profile', authentication, authorization, UserController.updateAPI)

module.exports = router