const CartModel = require('../models/cartModel')
const ProductModel = require('../models/productModel')
const { isValidObjectId } = require('../validations/validators')


const addOrCreateCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let { productId, cartId } = data

        if (productId && cartId) {
            if (!isValidObjectId(productId)) {
                return res.status(400).send({ status: false, message: "Invalid Product Id" })
            }
            if (!isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "Invalid Cart Id" })
            }

            let cartExists = await CartModel.findById(cartId)
            if (!cartExists) {
                return res.status(404).send({ status: false, message: "Cart doesnot exists" })
            }
            if (userId != cartExists.userId) {
                return res.status(403).send({ status: false, message: "Cannot add product in other user's cart." })
            }

            let productExists = await ProductModel.findOne({ _id: productId, isDeleted: false })
            if (!productExists) {
                return res.status(404).send({ status: false, message: "Product doesnot exists" })
            }

            let add = {}

            let arr = cartExists.items
            for (let i = 0; i < arr.length; i++) {
                if ((arr[i].productId) == productId) {
                    let sameProduct = {
                        productId: productId,
                        title: productExists.title,
                        price: productExists.price,
                        productImage: productExists.productImage,
                        quantity: (arr[i].quantity) + 1
                    }
                    arr.splice(i, 1, sameProduct)
                }
            }
            let a = arr.map((e) => e.productId.toString())
            if (a.indexOf(productId) == -1) {
                let product = {
                    productId: productId,
                    title: productExists.title,
                    price: productExists.price,
                    productImage: productExists.productImage,
                    quantity: 1
                }
                arr.push(product)
            }
            add.items = arr

            let value = 0
            for (let i = 0; i < arr.length; i++) {
                value = value + (productExists.price * arr[i].quantity)
            }
            add.totalPrice = value

            let totalItems = arr.length
            add.totalItems = totalItems

            let addToCart = await CartModel.findOneAndUpdate({ _id: cartId },
                { $set: add },
                { new: true })
            return res.status(200).send({ status: true, message: "Success", data: addToCart })
        } else {
            if (productId) {
                let cartExists = await CartModel.findOne({ userId: userId })
                if (cartExists) {
                    return res.status(400).send({ status: false, message: "Cart for this User already created. Please provide cartId also in request body" })
                }

                if (!isValidObjectId(productId)) {
                    return res.status(400).send({ status: false, message: "Invalid Product Id" })
                }

                let productExists = await ProductModel.findOne({ _id: productId, isDeleted: false })
                if (!productExists) {
                    return res.status(404).send({ status: false, message: "Product doesnot exists" })
                }
                let cart = { userId: userId }

                let items = []
                let product = {
                    productId: productId,
                    title: productExists.title,
                    price: productExists.price,
                    productImage: productExists.productImage,
                    quantity: 1
                }
                items.push(product)
                cart.items = items

                let totalPrice = (product.price) * (product.quantity)
                cart.totalPrice = totalPrice

                let totalItems = items.length
                cart.totalItems = totalItems

                let newCart = await CartModel.create(cart)//.populate('productId')
                return res.status(201).send({ status: true, message: "Cart created successfully", data: newCart })
            } else {
                return res.status(400).send({ status: false, message: "Invalid request body" })
            }
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, error: error.message })
    }
}


module.exports = { addOrCreateCart }