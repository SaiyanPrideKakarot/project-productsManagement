const productModel = require("../models/productModel")

const { isValid } = require("../validator/validator");
// query filter


const getProductQuery = async function (req, res) {
    try {
        let query = req.query;

        let { size, name, priceGreaterThan, priceLessThan, priceSort } = query

        let filter = { isDeleted: false }
        if (size) {
            size = size.split(",").map(ele => ele.trim())
            if (Array.isArray(size)) {
                let enumArr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                let uniqueSizes = [...new Set(size)]
                for (let ele of uniqueSizes) {
                    if (enumArr.indexOf(ele) == -1) {
                        return res.status(400).send({ status: false, message: `'${ele}' is not a valid size, only these sizes are available [S, XS, M, X, L, XXL, XL]` })
                    }
                }
                filter["availableSizes"] = { $in: uniqueSizes };
            } else return res.status(400).send({ status: false, message: "size  would be array type" })
        }


        if (name) {
            if (!isValid(name)) return res.status(400).send({ status: false, message: "name  is currect format" })
            filter["title"] = { "$regex": name };
        }

        if (priceGreaterThan) {
            if (!Number(priceGreaterThan)) return res.status(400).send({ status: false, message: "priceGreaterThan should be in valid number/decimal format" })
            filter["price"] = { $gte: priceGreaterThan }
        }

        if (priceLessThan) {
            if (!Number(priceLessThan)) return res.status(400).send({ status: false, message: "priceLessThan should be in valid number/decimal format" })
            filter["price"] = { $lte: priceLessThan }
        }

        if (priceGreaterThan && priceLessThan) {
            if (!Number(priceGreaterThan)) return res.status(400).send({ status: false, message: "priceGreaterThan should be in valid number/decimal format" })
            if (!Number(priceLessThan)) return res.status(400).send({ status: false, message: "priceLessThan should be in valid number/decimal format" })
            filter["price"] = { $gte: priceGreaterThan, $lte: priceLessThan }
        }

        const foundProducts = await productModel.find(filter).select({ __v: 0 })

        if (!priceSort) priceSort = 1
        if (priceSort == 1) {
            foundProducts.sort((a, b) => {
                return a.price - b.price
            })
        }
        else if (priceSort == -1) {
            foundProducts.sort((a, b) => {
                return b.price - a.price
            })
        }

        else return res.status(400).send({ status: false, message: "priceSort should be 1 or -1" })

        if (foundProducts.length == 0) return res.status(404).send({ status: false, message: " product  not found for the given query" })

        return res.status(200).send({ status: "true", message: 'Success', data: foundProducts })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = {  getProductQuery }

