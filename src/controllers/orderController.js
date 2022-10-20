const OrderModel = require('../models/orderModel')
const CartModel = require('../models/cartModel')
const ProductModel = require('../models/productModel')
const { isValidBoolean, isValidString, isValidObjectId } = require('../validations/validators')


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

            let cartDetails = await CartModel.findById(cartId)
            if (!cartDetails) {
                return res.status(404).send({ status: false, message: `Cart with cart id ${cartId} doesnot exists` })
            }
            if (cartDetails.userId.toString() != userId) {
                return res.status(403).send({ status: false, message: "You are not allowed to order using other user's cart" })
            }

            if (cartDetails.totalItems == 0) {
                return res.status(400).send({ status: false, message: "For placing order, your cart should not be empty." })
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

            let emptyCart = await CartModel.findOneAndUpdate(
                { _id: cartId },
                { $set: { items: [], totalPrice: 0, totalItems: 0 } },
                { new: true }
            )

            return res.status(201).send({ status: true, message: "Success", data: result })
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
        if (!cartDetails) {
            return res.status(404).send({ status: false, message: "Cart doesnot exists" })
        }
        if (cartDetails.userId.toString() != userId) {
            return res.status(403).send({ status: false, message: "You are not allowed to order using other user's cart" })
        }

        let data = req.body
        let { orderId, cancellable, status } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Request body is empty" })
        }

        if (!orderId) {
            return res.status(400).send({ status: false, message: "Please provide order Id" })
        }
        if (!isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "Invalid Order Id" })
        }
        let order = await OrderModel.findById(orderId)
        if (!order) {
            return res.status(404).send({ status: false, message: `Order with orderId ${orderId} not found` })
        }

        if (cancellable) {
            if (!isValidBoolean(cancellable)) {
                return res.status(400).send({ status: false, message: "Cancellable should only boolean type i.e. true or false" })
            }
        }
        if (status) {
            if (!isValidString(status)) {
                return res.status(400).send({ status: false, message: "Status must be in string" })
            }
            status = status.trim().toLowerCase()
            let arr = ["pending", "completed", "cancelled"]
            if (arr.indexOf(status) == -1) {
                return res.status(400).send({ status: false, message: 'Status should only be among these: [pending, completed, cancelled]' })
            }
            if (status == "cancelled") {
                if (order.cancellable == false) {
                    return res.status(400).send({ status: false, message: "This order cannot be cancelled" })
                }
            }
        }

        let updatedOrder = await OrderModel.findOneAndUpdate(
            { _id: orderId },
            { $set: data },
            { new: true }
        ).populate({ path: 'items.productId', model: ProductModel, select: ["title", "price", "productImage"] })

        return res.status(200).send({ status: true, message: "Success", data: updatedOrder })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, error: error.message })
    }
}


module.exports = { createOrder, updateOrder }