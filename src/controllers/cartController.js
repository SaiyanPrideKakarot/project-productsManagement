const CartModel = require('../models/cartModel')
const ProductModel = require('../models/productModel')
const { isValidObjectId, isValidString, isValidNumber, isValidRemoveProduct } = require('../validations/validators')


const addOrCreateCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let { productId, cartId } = data

        if (productId && cartId) {
            if (!isValidString(productId)) {
                return res.status(400).send({ status: false, message: "Product id must be in string and cannot be empty" })
            }
            if (!isValidObjectId(productId)) {
                return res.status(400).send({ status: false, message: "Invalid Product Id" })
            }

            if (!isValidString(cartId)) {
                return res.status(400).send({ status: false, message: "Cart id must be in string and cannot be empty" })
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
                        quantity: (arr[i].quantity) + 1
                    }
                    arr.splice(i, 1, sameProduct)
                }
            }
            let a = arr.map((e) => e.productId.toString())
            if (a.indexOf(productId) == -1) {
                let product = {
                    productId: productId,
                    quantity: 1
                }
                arr.push(product)
            }
            add.items = arr

            let value = cartExists.totalPrice + productExists.price
            add.totalPrice = value

            let totalItems = arr.length
            add.totalItems = totalItems

            let addToCart = await CartModel.findOneAndUpdate({ _id: cartId },
                { $set: add },
                { new: true }).populate({ path: 'items.productId', model: ProductModel, select: ["title", "price", "productImage"] })
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
                    quantity: 1
                }
                items.push(product)
                cart.items = items

                let totalPrice = (productExists.price) * (product.quantity)
                cart.totalPrice = totalPrice

                let totalItems = items.length
                cart.totalItems = totalItems

                let newCart = await CartModel.create(cart)
                let result = await CartModel.findById(newCart._id).populate({ path: 'items.productId', model: ProductModel, select: ["title", "price", "productImage"] })
                return res.status(201).send({ status: true, message: "Cart created successfully", data: result })
            } else {
                return res.status(400).send({ status: false, message: "Invalid request body" })
            }
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, error: error.message })
    }
}


const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId

        let data = req.body;
        // destucturing
        let { cartId, productId, removeProduct } = data;

        // checking body for empty or not 
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Request body not  empty" })
        }
        if (!cartId && !productId && !removeProduct) {
            return res.status(400).send({ status: false, message: "Invalid request body" })
        } else {
            // validation for productId
            if (!isValidString(productId)) {
                return res.status(400).send({ status: false, message: "Please provide productId" })
            }
            if (!isValidObjectId(productId)) {
                return res.status(400).send({ status: false, message: `The given productId: ${productId} is not in proper format` })
            }
            const searchProduct = await ProductModel.findOne({ _id: productId, isDeleted: false })
            if (!searchProduct) {
                return res.status(404).send({ status: false, message: `Product details are not found with this productId: ${productId}, it must be deleted or not exists` });
            }
            // validation for cartId
            if (!isValidString(cartId)) {
                return res.status(400).send({ status: false, message: "Please provide cartId" })
            }
            if (!isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: `The given cartId: ${cartId} is not in invalid format` })
            }
            //checking cart details available or not 
            const searchCart = await CartModel.findById(cartId)
            if (!searchCart) {
                return res.status(404).send({ status: false, message: `Cart does not exists with this provided cartId: ${cartId}` })
            }
            if (searchCart.userId.toString() != userId) {
                return res.status(403).send({ status: false, message: "You are not allowed to remove products from other user's cart" })
            }
            //check cart is now empty
            if (searchCart.items.length == 0) {
                return res.status(400).send({ status: false, message: "Cart is already empty. You have not added any products in your cart" });
            }
            // validatiion for removeProduct
            if (!isValidNumber(removeProduct)) {
                return res.status(400).send({ status: false, message: "removeProduct is required" })
            }
            if (!isValidRemoveProduct(removeProduct)) {
                return res.status(400).send({ status: false, message: "Enter valid removeproduct it can be only be '0' & '1'" })
            }
            let cart = searchCart.items;
            for (let i = 0; i < cart.length; i++) {
                if (cart[i].productId == productId) {
                    const priceChange = cart[i].quantity * searchProduct.price

                    // directly remove a product from the cart ireespective of its quantity
                    if (removeProduct == 0) {
                        const productRemove = await CartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, totalPrice: searchCart.totalPrice - priceChange, totalItems: searchCart.totalItems - 1 }, { new: true }).populate({ path: 'items.productId', model: ProductModel, select: ["title", "price", "productImage"] })
                        return res.status(200).send({ status: true, message: 'Success', data: productRemove })
                    }

                    // remove the product when its quantity is 1
                    if (removeProduct == 1) {
                        if (cart[i].quantity == 1 && removeProduct == 1) {
                            const priceUpdate = await CartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId } }, totalPrice: searchCart.totalPrice - priceChange, totalItems: searchCart.totalItems - 1 }, { new: true }).populate({ path: 'items.productId', model: ProductModel, select: ["title", "price", "productImage"] })
                            return res.status(200).send({ status: true, message: 'Success', data: priceUpdate })
                        } else {
                            cart[i].quantity = cart[i].quantity - 1
                            const updatedCart = await CartModel.findByIdAndUpdate({ _id: cartId }, { $set: { items: cart, totalPrice: searchCart.totalPrice - searchProduct.price } }, { new: true }).populate({ path: 'items.productId', model: ProductModel, select: ["title", "price", "productImage"] })
                            return res.status(200).send({ status: true, message: 'Success', data: updatedCart })
                        }
                    }
                }
            }
            return res.status(400).send({ status: false, message: `You don't have any product of productId: ${productId}.` })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message });
    }
}


const getCart = async (req, res) => {
    try {
        let userId = req.params.userId;

        let isCart = await CartModel.findOne({ userId: userId }).populate({ path: 'items.productId', model: ProductModel, select: ["title", "price", "productImage"] })

        if (!isCart) {
            return res.status(404).send({ status: false, message: "Cart doesmot exist" });
        }

        if (userId != isCart.userId.toString()) {
            return res.status(403).send({ status: false, message: "You are not allowed to view other user's cart" })
        }
        return res.status(200).send({ status: true, message: "Success", data: isCart });


    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message });
    }
};


const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        let cart = await CartModel.findOne({ userId: userId })
        if (!cart) {
            return res.status(404).send({ status: false, message: "Cart doesnot exist" })
        }

        if (cart.userId.toString() != userId) {
            return res.status(403).send({ status: false, message: "You are not allowed to empty other user's cart" })
        }

        let update = await CartModel.findOneAndUpdate({ userId: userId }, {$set: { items: [], totalItems: 0, totalPrice: 0 }}, { new: true })

        return res.status(204).send({ status: true, message: "Success", data: update })

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message });
    }
}


module.exports = { addOrCreateCart, updateCart, getCart, deleteCart }