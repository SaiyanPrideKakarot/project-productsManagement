const ProductModel = require('../models/productModel')
const { isValidObjectId, isValidNumber, isValidBoolean, isValidSizes, isNumberWithoutDecimal, isValidImage } = require('../validations/validators')
const { uploadProductImages } = require('../controllers/awsController')


const createProduct = async function (req, res) {
    try {
        let data = req.body
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted, deletedAt } = data
        let productImage = req.files

        if ((Object.keys(data).length == 0) && !productImage) {
            return res.status(400).send({ status: false, message: "Please provide appropriate details" })
        }

        let newData = {}

        if (!title) {
            return res.status(400).send({ status: false, message: "Title is required" })
        }
        let uniquetitle = await ProductModel.findOne({ title: title })
        if (uniquetitle) {
            return res.status(409).send({ status: false, message: ` Title: ${title} already exists` })
        }
        newData.title = title.trim().toLowerCase()

        if (!description) {
            return res.status(400).send({ status: false, message: "Description is required" })
        }
        newData.description = description.trim()

        if (!price) {
            return res.status(400).send({ status: false, message: "Price is required" })
        }
        price = +price
        if (!isValidNumber(price)) {
            return res.status(400).send({ status: false, message: "Price can only be in numbers" })
        }
        newData.price = price

        if (!currencyId) {
            currencyId = 'INR'
        }
        currencyId = currencyId.trim().toUpperCase()
        if (currencyId != 'INR') {
            return res.status(400).send({ status: false, message: "Invalid currency id. Currency Id must be only INR " });
        }
        newData.currencyId = currencyId

        if (!currencyFormat) {
            currencyFormat = '₹'
        }
        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, message: `CurrencyFormat must be only "₹"` });
        }
        newData.currencyFormat = currencyFormat.trim()

        if (isFreeShipping) {
            isFreeShipping = isFreeShipping.trim()
            if (isFreeShipping == 'true') {
                newData.isFreeShipping = true
            } else if (isFreeShipping == 'false') {
                newData.isFreeShipping = false
            } else {
                return res.status(400).send({ status: false, message: "isFreeShipping's value can only be true or false" })
            }
        }

        if (productImage.length === 0) {
            return res.status(400).send({ status: false, message: "Please upload product image" })
        }
        if (productImage.length > 1) {
            return res.status(400).send({ status: false, message: "You can upload only one image in Product Image" })
        }
        if (!isValidImage(productImage[0].mimetype)) {
            return res.status(400).send({ status: false, message: "Invalid image type. Only jpg, png, jpeg image type are accepted." })
        }
        let uploadedImage = await uploadProductImages(productImage[0])
        newData.productImage = uploadedImage

        if (style) {
            newData.style = style.trim()
        }

        if (!availableSizes) {
            return res.status(400).send({ status: false, message: "Please select atleast one available size" })
        }
        availableSizes = availableSizes.trim().toUpperCase()
        availableSizes = availableSizes.split(" ").map(String)
        if (!isValidSizes(availableSizes)) {
            return res.status(400).send({ status: false, message: "Availablesizes must be among these: S, XS ,M ,X ,L ,XXL ,XL " })
        }
        newData.availableSizes = availableSizes

        if (installments) {
            installments = +installments
            if (!isValidNumber(installments)) {
                return res.status(400).send({ status: false, message: "Installments should only be Numbers" })
            }
            if (!isNumberWithoutDecimal(installments)) {
                return res.status(400).send({ status: false, message: "Installments cannot be in decimals" })
            }
            newData.installments = installments
        }

        if (isDeleted) {
            return res.status(400).send({ status: false, message: "You cannot delete a product at the time of creation" })
        }

        if (deletedAt) {
            return res.status(400).send({ status: false, message: "You cannot set date of deletion at time of creation" })
        }

        let newProduct = await ProductModel.create(newData)
        return res.status(201).send({ status: true, message: "Product created successfully", data: newProduct });

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, msg: "Error", error: err.message });
    }
}


const getProductByQuery = async function (req, res) {
    try {
        let data = req.query;

        let filter = { isDeleted: false }

        if (Object.keys(data).length == 0) {
            let allProducts = await ProductModel.find(filter).sort({ price: 1 })
            if (allProducts.length == 0) {
                return res.status(404).send({ status: false, message: "No products found or every product is deleted." })
            }
            return res.status(200).send({ status: false, message: "All Products", data: allProducts })
        }

        let { size, name, priceGreaterThan, priceLessThan, priceSort } = data

        if (size || name || priceGreaterThan || priceLessThan || priceSort) {
            if (size) {
                size = size.split(",").map(ele => ele.trim().toUpperCase())
                if (Array.isArray(size)) {
                    let enumArr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                    let uniqueSizes = [...new Set(size)]
                    for (let ele of uniqueSizes) {
                        if (enumArr.indexOf(ele) == -1) {
                            return res.status(400).send({ status: false, message: `'${ele}' is not a valid size, please enter/select sizes among these [S, XS, M, X, L, XXL, XL]` })
                        }
                    }
                    filter["availableSizes"] = { $in: uniqueSizes };
                } else {
                    return res.status(400).send({ status: false, message: "Size would be array type" })
                }
            }


            if (name) {
                filter["title"] = { "$regex": name };
            }

            if (priceGreaterThan && priceLessThan) {
                priceGreaterThan = +priceGreaterThan
                priceLessThan = +priceLessThan
                if (!isValidNumber(priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "PriceGreaterThan should be in valid number/decimal format" })
                }
                if (!isValidNumber(priceLessThan)) {
                    return res.status(400).send({ status: false, message: "PriceLessThan should be in valid number/decimal format" })
                }
                filter["price"] = { $gte: priceGreaterThan, $lte: priceLessThan }
            } else {
                if (priceGreaterThan) {
                    priceGreaterThan = +priceGreaterThan
                    if (!isValidNumber(priceGreaterThan)) {
                        return res.status(400).send({ status: false, message: "PriceGreaterThan should be in valid number/decimal format" })
                    }
                    filter["price"] = { $gte: priceGreaterThan }
                }

                if (priceLessThan) {
                    priceLessThan = +priceLessThan
                    if (!isValidNumber(priceLessThan)) {
                        return res.status(400).send({ status: false, message: "PriceLessThan should be in valid number/decimal format" })
                    }
                    filter["price"] = { $lte: priceLessThan }
                }
            }

            const foundProducts = await ProductModel.find(filter).select({ __v: 0 })

            if (!priceSort) {
                priceSort = 1
            }
            if (priceSort == 1) {
                foundProducts.sort((a, b) => {
                    return a.price - b.price
                })
            } else if (priceSort == -1) {
                foundProducts.sort((a, b) => {
                    return b.price - a.price
                })
            } else {
                return res.status(400).send({ status: false, message: "PriceSort should be 1 or -1" })
            }

            if (foundProducts.length == 0) {
                return res.status(404).send({ status: false, message: "Products not found for the given query" })
            }

            return res.status(200).send({ status: "true", message: 'Success', data: foundProducts })

        } else {
            return res.status(400).send({ status: false, message: "Invalid filters or query" })
        }

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}


const getProductById = async function (req, res) {
    try {

        let productId = req.params.productId;

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid productId" });
        }

        let productDetails = await ProductModel.findOne({ _id: productId, isDeleted: false });
        if (!productDetails) {
            return res.status(404).send({ status: false, message: "No such product exists" });
        }
        return res.status(200).send({ status: true, message: "Success", data: productDetails });

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};


const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid Product Id in path params" })
        }

        let data = req.body
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments } = data
        let file = req.files
        let editor = {}

        if (title) {
            editor.title = title.trim().toLowerCase()
        }

        if (description) {
            editor.description = description.trim()
        }

        if (price) {
            price = +price
            if (!isValidNumber(price)) {
                return res.status(400).send({ status: false, message: "Price should only be Numbers" })
            }
            editor.price = price
        }

        if (currencyId) {
            return res.status(400).send({ status: false, message: "Currency Id can only be INR and it cannot be changed" })
        }

        if (currencyFormat) {
            return res.status(400).send({ status: false, message: "Currency Format can only be ₹ and it cannot be changed" })
        }

        if (isFreeShipping) {
            isFreeShipping = isFreeShipping.trim()
            if (isFreeShipping == 'true') {
                newData.isFreeShipping = true
            } else if (isFreeShipping == 'false') {
                newData.isFreeShipping = false
            } else {
                return res.status(400).send({ status: false, message: "isFreeShipping's value can only be true or false" })
            }
            editor.isFreeShipping = isFreeShipping
        }

        if (style) {
            editor.style = style.trim()
        }

        if (availableSizes) {
            sizes = availableSizes.trim().toUpperCase()
            sizes = availableSizes.split(" ").map(String)
            if (!isValidSizes(sizes)) {
                return res.status(400).send({ status: false, message: "Please provide valid size" })
            }
            let check = await ProductModel.findById(productId)
            if ((check.availableSizes).every((e) => sizes.includes(e))) {
                sizes.splice(sizes.indexOf(e), 1)
            } else {
                sizes.push(e)
            }
            editor.availableSizes = availableSizes
        }

        if (installments) {
            installments = +installments
            if (!isValidNumber(installments)) {
                return res.status(400).send({ status: false, message: "Installments should only be Numbers" })
            }
            if (!isNumberWithoutDecimal(installments)) {
                return res.status(400).send({ status: false, message: "Installments cannot be in decimals" })
            }
            editor.installments = installments
        }

        if (productImage) {
            if (file.length == 0) {
                return res.status(400).send({ status: false, message: "If you want to update product image then you have to upload image" })
            }
            if (file.length > 1) {
                return res.status(400).send({ status: false, message: "Please upload only one image" })
            }
            if (!isValidImage(file[0].mimetype)) {
                return res.status(400).send({ status: false, message: "Invalid image type. Only jpg, png, jpeg image type are accepted." })
            }
            let uploadImage = await uploadProductImages(file[0])
            editor.productImage = uploadImage
        }

        let updateData = await ProductModel.findOneAndUpdate({ _id: productId, isDeleted: false },
            { $set: editor },
            { new: true })
        if (!updateData) {
            return res.status(404).send({ status: false, message: "Product not found" })
        }
        return res.status(200).send({ status: true, message: "Success", data: updateData })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, error: error.message })
    }
}


const deleteProduct = async function (req, res) {
    try {

        let productId = req.params.productId;

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Inavlid productId." });
        }
        let findProduct = await ProductModel.findOne({ _id: productId, isDeleted: false });
        if (!findProduct) {
            return res.status(404).send({ status: false, message: `No product found by ${productId}` });
        }
        if (findProduct.isDeleted == true) {
            return res.status(400).send({ status: false, message: `Product has been already deleted.` });
        }

        let deletedProduct = await ProductModel.findOneAndUpdate({ _id: productId },
            { $set: { isDeleted: true, deletedAt: new Date() } },
            { new: true }).select({ title: 1, isDeleted: 1, deletedAt: 1 });

        return res.status(200).send({ status: true, message: "Product deleted successfully.", data: deletedProduct });

    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};


module.exports = { createProduct, updateProduct, getProductByQuery, getProductById, deleteProduct }