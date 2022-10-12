const jwt = require('jsonwebtoken')
const UserModel = require('../models/userModel')
const { isValidObjectId } = require('../validations/validators')


const authentication = function (req, res, next) {
    try {
        let token = req.header("Authorization")
        if (!token) {
            return res.status(401).send({status: false, message: "Token must be provided"})
        }
        let bearer = token.split(" ")
        let bearerToken = bearer[1]
        let decodedToken = jwt.verify(bearerToken, "Project5-group03", { ignoreExpiration: true })
        if (!decodedToken) {
            return res.status(401).send({status: false, message: "Invalid Token"})
        }
        if (Date.now > decodedToken.exp * 1000) {
            return res.status(401).send({ status: false, message: "Token expired" })
        }
        req.decodedToken = decodedToken
        res.setHeader("Authorization", token)
        next()
    } catch (error) {
        console.log(error)
        return res.status(500).send({status: false, message: error.message})
    }
}


const authorization = async function (req, res, next) {
    try {
        let decodedToken = req.decodedToken
        let userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({status: false, message: "Invalid User Id"})
        }
        // let user = await UserModel.findById(userId)
        // if (!user) {
        //     return res.status(404).send({status: false, message: "User not found"})
        // }
        if (decodedToken.userId != userId) {
            return res.status(403).send({status: false, message: "User not Authorized"})
        }
        next()
    } catch (error) {
        console.log(error)
        return res.status(500).send({status: false, message: error.message})
    }
}


module.exports = { authentication, authorization }