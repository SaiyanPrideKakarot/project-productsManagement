const OrderModel = require('../models/orderModel')
const CartModel = require('../models/cartModel')
const { isValidBoolean, isValidStatus, isValidString, isValidObjectId } = require('../validations/validators')


const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId

        let data = req.body
        let { cartId, cancellable } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Request body is empty" })
        }

        if (cartId || cancellable) {
            if (!cartId) {
                return res.status(400).send({ status: false, message: "Cart id is required" })
            }
            cartId = cartId.trim()
            if (!isValidString(cartId)) {
                return res.status(400).send({ status: false, message: "Cart Id must be in string and cannot be empty" })
            }
            if (!isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "Invalid cart id" })
            }

            let cartDetails = await CartModel.findOne({ _id: cartId })
            if (!cartDetails) {
                return res.status(404).send({ status: false, message: `Cart with cart id ${cartId} doesnot exists` })
            }
            if (cartDetails.userId.toString() != userId) {
                return res.status(403).send({ status: false, message: "You are not allowed to order using other user's cart" })
            }

            let order = {
                userId: userId,
                items: cartDetails.items,
                totalPrice: cartDetails.totalPrice,
                totalItems: cartDetails.totalItems,
            }
            let totalQuantity = 0
            let arr = cartDetails.items
            for (let i = 0; i < arr.length; i++) {
                totalQuantity = totalQuantity + arr[i].quantity
            }
            order.totalQuantity = totalQuantity

            if (cancellable) {
                if (!isValidBoolean(cancellable)) {
                    return res.status(400).send({ status: false, message: "Cancellable should only boolean type i.e. true or false" })
                }
                order.cancellable = cancellable
            }

            let newOrder = await OrderModel.create(order)
            let result = await OrderModel.findById(newOrder._id).populate({ path: 'items.productId', model: ProductModel, select: ["title", "price", "productImage"] })

            return res.status(201).send({status: true, message: "Success", data: result})
        } else {
            return res.status(400).send({ status: false, message: "Invalid request body" })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, error: error.message })
    }
}


const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId

        let cartDetails = await CartModel.findOne({ userId: userId })
        if (cartDetails.userId.toString() != userId) {
            return res.status(403).send({ status: false, message: "You are not allowed to order using other user's cart" })
        }

        let data = req.body
        let { cancellable, status } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Request body is empty" })
        }
        if (cancellable || status) {
            if (cancellable) {
                if (!isValidBoolean(cancellable)) {
                    return res.status(400).send({ status: false, message: "Cancellable should only boolean type i.e. true or false" })
                }
            }
            if (status) {
                status = status.trim().toLowerCase()
                if (!isValidStatus(status)) {
                    return res.status(400).send({ status: false, message: `Status should only be among these: "pending", "completed", "cancelled"` })
                }
            }

            let updatedOrder = await OrderModel.findOneAndUpdate(
                { userId: userId },
                { $set: data },
                { new: true }
            ).populate({ path: 'items.productId', model: ProductModel, select: ["title", "price", "productImage"] })

            return res.status(200).send({ status: true, message: "Success", data: updatedOrder })
        } else {
            return res.status(400).send({ status: false, message: "Invalid request body" })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, error: error.message })
    }
}


module.exports = { createOrder, updateOrder }