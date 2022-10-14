const express = require('express')
const router = express.Router()

const UserController = require('../controllers/userController')
const ProductController = require('../controllers/productController')
const { authentication, authorization } = require('../middlewares/auth')


//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< USERS APIs >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

router.post('/register', UserController.createUser)
router.post('/login', UserController.loginUser)
router.get('/user/:userId/profile', authentication, UserController.getUserProfile)
router.put('/user/:userId/profile', authentication, authorization, UserController.updateAPI)

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< PRODUCTS APIs >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

router.post('/products', ProductController.createProduct)
router.get('/products', ProductController.getProductByQuery)
router.get('/products/:productId', ProductController.getProductById)
router.put('/products/:productId', ProductController.updateProduct)
router.delete('/products/:productId', ProductController.deleteProduct)

module.exports = router