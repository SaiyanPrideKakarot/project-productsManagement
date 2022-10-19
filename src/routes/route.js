const express = require('express')
const router = express.Router()

const UserController = require('../controllers/userController')
const ProductController = require('../controllers/productController')
const CartController = require('../controllers/cartController')
const OrderController = require('../controllers/orderController')
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

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< USERS APIs >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

router.post('/users/:userId/cart', authentication, authorization, CartController.addOrCreateCart)
router.put('/users/:userId/cart', authentication, authorization, CartController.updateCart)
router.get('/users/:userId/cart', authentication, authorization, CartController.getCart)
router.delete('/users/:userId/cart', authentication, authorization, CartController.deleteCart)

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< USERS APIs >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

router.post('/users/:userId/orders', authentication, authorization, OrderController.createOrder)
router.put('/users/:userId/orders', authentication, authorization, OrderController.updateOrder)


module.exports = router