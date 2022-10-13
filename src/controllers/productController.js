const ProductModel = require('../models/productModel')
const { isValidObjectId, isValidNumber, isValidBoolean, isValidSizes, isNumberWithoutDecimal } = require('../validations/validators')
const { uploadFile } = require('../controllers/awsController')



const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!isValidObjectId(productId)) {
            return res.status(400).send({status: false, message: "Invalid Product Id in path params"})
        }

        let data = req.body
        let {title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments} = data
        let productImage = req.files
        let editor = {}

        if (title) {
            editor.title = title.trim()
        }

        if (description) {
            editor.description = description.trim()
        }

        if (price) {
            if (!isValidNumber(price)) {
                return res.status(400).send({status: false, message: "Price should only be Numbers"})
            }
            editor.price = price
        }

        if (currencyId) {
            return res.status(400).send({status: false, message: "Currency Id can only be INR and it cannot be changed"})
        }

        if (currencyFormat) {
            return res.status(400).send({status: false, message: "Currency Format can only be ₹ and it cannot be changed"})
        }

        if (isFreeShipping) {
            if (!isValidBoolean(isFreeShipping)) {
                return res.status(400).send({status: false, message: "isFreeShipping should only of boolean type"})
            }
            editor.isFreeShipping = isFreeShipping
        }

        if (style) {
            editor.style = style.trim()
        }

        if (availableSizes) {
            if (!isValidSizes) {
                return res.status(400).send({status: false, message: "Please provide a valid size"})
            }
            // let check = await ProductModel.findById(productId)
            // if ((check.availableSizes).includes(availableSizes)) {

            // }
            editor.availableSizes = availableSizes
        }

        if (installments) {
            if (!isValidNumber(installments)) {
                return res.status(400).send({status: false, message: "Installments should only be Numbers"})
            }
            if (!isNumberWithoutDecimal(installments)) {
                return res.status(400).send({status: false, message: "Installments cannot be in decimals"})
            }
            editor.installments = installments
        }

        if (productImage) {
            if (productImage.length == 0) {
                return res.status(400).send({status: false, message: "If you want to update product image then you have to upload image"})
            }
            if (productImage.length > 1) {
                return res.status(400).send({status: false, message: "Please upload only one image"})
            }
            if (!isValidImage(productImage[0].mimetype)) {
                return res.status(400).send({ status: false, message: "Invalid image type. Only jpg, png, jpeg image type are accepted." })
            }
            let uploadImage = await uploadFile(productImage[0])
            editor.productImage = uploadImage
        }

        let updateData = await ProductModel.findOneAndUpdate({_id: productId, isDeleted: false},
            {$set: editor},
            {new: true})
        if (!updateData) {
            return res.status(404).send({status: false, message: "Product not found"})
        }
        return res.status(200).send({status: true, message: "Success", data: updateData})
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, error: error.message })
    }
}


module.exports = { updateProduct }