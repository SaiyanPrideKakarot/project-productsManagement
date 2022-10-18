const CartModel = require('../models/cartModel')
const ProductModel = require('../models/productModel')
const { isValidObjectId } = require('../validations/validators')


const addOrCreateCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let { productId, cartId } = data

        let cart = { userId: userId }

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
            console.log(a)
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
//Api for update card


const updateCart = async function (req, res) {
    try {
        userId = req.params.userId

        // validation for userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `${userId} is invalid` })

        // find the user Id
        const findUser = await UserModel.findOne({ _id: userId })
        if (!findUser)
            return res.status(404).send({ status: false, message: "User does not found" })

        //Authorization 
        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization  invalid" })

        const data = req.body;
        // destucturing
        let { cartId, productId, removeProduct } = data;

        // checking body for empty or not 
        if (!isValidRequest(data))
            return res.status(400).send({ status: false, message: "Request body not  empty" })

        // validation for productId
        if (!isValid(productId))
            return res.status(400).send({ status: false, message: "Please provide productId" })
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: `The given productId: ${productId} is not in proper format` })

        const searchProduct = await ProductModel.findOne({ _id: productId, isDeleted: false })
        if (!searchProduct)
            return res.status(404).send({ status: false, message: `Product details are not found with this productId: ${productId}, it must be deleted or not exists` });

        // validation for cartId
        if (!isValid(cartId))
            return res.status(400).send({ status: false, message: "Please provide cartId" })
        if (!isValidObjectId(cartId))
            return res.status(400).send({ status: false, message: `The given cartId: ${cartId} is not in invalid format` })
        //checking cart details available or not 
        const searchCart = await CartModel.findOne({ _id: cartId })
        if (!searchCart)
            return res.status(404).send({ status: false, message: `Cart does not exists with this provided cartId: ${cartId}` })

        //check cart is now empty
        if (searchCart.items.length == 0)
            return res.status(400).send({ status: false, message: "You have not added any products in your cart" });

        // validatiion for removeProduct
        if (!isValid(removeProduct))
            return res.status(400).send({ status: false, message: "removeProduct is required" })
        if (!isValidremoveProduct(removeProduct))
            return res.status(400).send({ status: false, message: "Enter valid removeproduct it can be only be '0' & '1'" })

        let cart = searchCart.items;
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                const priceChange = cart[i].quantity * searchProduct.price

                // directly remove a product from the cart ireespective of its quantity
                if (removeProduct == 0) {
                    const productRemove = await CartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, totalPrice: searchCart.totalPrice - priceChange, totalItems: searchCart.totalItems - 1 }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: productRemove })
                }

                // remove the product when its quantity is 1
                if (removeProduct == 1) {
                    if (cart[i].quantity == 1 && removeProduct == 1) {
                        const priceUpdate = await CartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId } }, totalPrice: searchCart.totalPrice - priceChange, totalItems: searchCart.totalItems - 1 }, { new: true })
                        return res.status(200).send({ status: true, message: 'Success', data: priceUpdate })
                    }

                    // decrease the products quantity by 1
                    cart[i].quantity = cart[i].quantity - 1
                    const updatedCart = await CartModel.findByIdAndUpdate({ _id: cartId }, { items: cart, totalPrice: searchCart.totalPrice - searchProduct.price }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: updatedCart })
                }
            }
        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}



module.exports = { addOrCreateCart, updateCart }