const UserModel = require('../models/userModel')
const bcrypt = require('bcrypt')
const aws = require('aws-sdk')

const { isValidString, isValidName, isValidEmail, isValidPhone, isValidPassword, isValidPinCode } = require('../validations/validators')

const createUser = async function (req, res) {
    try {
        let data = req.body
        let { fname, lname, email, profileImage, phone, password, address } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Request Body cannot be empty" })
        }

        if (Object.keys(data).length > 7) {
            return res.status(400).send({ status: false, message: "Request Body can have only fname, lname, email, profileImage, phone, password, address" })
        }

        if (!fname) {
            return res.status(400).send({ status: false, message: "First Name is required" })
        }
        if (!isValidString(fname)) {
            return res.status(400).send({ status: false, message: "First Name can only be string and cannot be empty" })
        }
        fname = fname.trim()
        if (!isValidName(fname)) {
            return res.status({ status: false, message: "Please enter a valid First Name" })
        }

        if (!lname) {
            return res.status(400).send({ status: false, message: "Last Name is required" })
        }
        if (!isValidString(lname)) {
            return res.status(400).send({ status: false, message: "Last Name can only be string and cannot be empty" })
        }
        lname = lname.trim()
        if (!isValidName(lname)) {
            return res.status({ status: false, message: "Please enter a valid Last Name" })
        }

        if (!email) {
            return res.status(400).send({ status: false, message: "Email address is required" })
        }
        if (!isValidString(email)) {
            return res.status(400).send({ status: false, message: "Email can only be string and cannot be empty" })
        }
        email = email.trim().toLowerCase()
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Please enter a valid email" })
        }
        let notUniqueEmail = await UserModel.findOne({email: email})
        if (notUniqueEmail) {
            return res.status(400).send({status: false, message: `User with email address: ${email} already exists`})
        }

        if (!profileImage) {
            return res.status(400).send({ status: false, message: "Please Upload Profile Image" })
        }
        aws.config.update({
            accessKeyId: "AKIAY3L35MCRZNIRGT6N",
            secretAccessKey: "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",
            region: "ap-south-1"
        })
        let uploadImage = async (file) => {
            return new Promise(function (resolve, reject) {
                let s3 = new aws.S3({apiVersion: "2006-03-01"})
                let uploadParams = {
                    ACL: "public-read",
                    Bucket: "classroom-training-bucket",
                    Key: "project5Group03/profileImages" + file.originalname,
                    Body: file.buffer
                }
                s3.upload(uploadParams, function (error, data) {
                    if (error) {
                        return reject({"error": error})
                    }
                    console.log(data)
                    console.log("File Uploaded Successfully")
                    return resolve(data.Location)
                })
            })
        }
        let files = req.files
        if (!files) {
            return res.status(400).send({status: false, message: "No image found"})
        }
        if (files.length > 1) {
            return res.status(400).send({status: false, message: "You can upload only one image in Profile Image"})
        }
        let uploadFileUrl = await uploadImage(files[0])
        profileImage = `${uploadFileUrl}`

        if (!phone) {
            return res.status(400).send({status: false, message: "Phone Number is mandatory"})
        }
        if (!isValidString(phone)) {
            return res.status(400).send({status: false, message: "Phone Number must be in string and cannot be empty"})
        }
        phone = phone.trim()
        if (!isValidPhone(phone)) {
            return res.status(400).send({status: false, message: "Please provide a valid phone number"})
        }
        let notUniquePhone = await UserModel.findOne({phone: phone})
        if (notUniquePhone) {
            return res.status(400).send({status: false, message: `User with Phone: ${phone} already exists`})
        }

        if (!password) {
            return res.status(400).send({status: false, message: "Password is mandatory"})
        }
        if (!isValidString(password)) {
            return res.status(400).send({status: false, message: "Password must be in string and cannot be empty"})
        }
        if (!isValidPassword(password)) {
            return res.status(400).send({status: false, message: "Password must be atlease 8 characters and maximum 15 characters"})
        }
        let encrypt = bcrypt.hash(password, 10, function (err, hash) {
            console.log(hash)
            password = hash
        })

        if (!address) {
            return res.status(400).send({status: false, message: "Address is a mandatory field"})
        }
        if (Object.prototype.toString.call(address) != "[object Object]") {
            return res.status(400).send({status: false, message: "Address should be of Object type"})
        }

        if (!address.shipping) {
            return res.status(400).send({status: false, message: "Shipping address is a mandatory field"})
        }
        if (Object.prototype.toString.call(address.shipping) != "[object Object]") {
            return res.status(400).send({status: false, message: "Shipping Address should be of Object type"})
        }

        if (!address.shipping.street) {
            return res.status(400).send({status: false, message: "Street of shipping address is mandatory"})
        }
        if (!isValidString(address.shipping.street)) {
            return res.status(400).send({status: false, message: "Street of shipping address must be in string and cannot be empty"})
        }
        address.shipping.street = address.shipping.street.trim()

        if (!address.shipping.city) {
            return res.status(400).send({status: false, message: "City of shipping address is mandatory"})
        }
        if (!isValidString(address.shipping.city)) {
            return res.status(400).send({status: false, message: "City of shipping address must be in string and cannot be empty"})
        }
        address.shipping.city = address.shipping.city.trim()

        if (!address.shipping.pincode) {
            return res.status(400).send({status: false, message: "Pincode of shipping address is mandatory"})
        }
        if (typeof(address.shipping.pincode) != "number") {
            return res.status(400).send({status: false, message: "Pincode of shipping address must be in number"})
        }
        address.shipping.pincode = address.shipping.pincode.trim()
        if (!isValidPinCode(address.shipping.pincode)) {
            return res.status(400).send({status: false, message: "Please enter a valid pincode for shipping address. A valid pincode is of 6 digits and doesnot starts with 0"})
        }

        if (!address.billing) {
            return res.status(400).send({status: false, message: "Billing address is a mandatory field"})
        }
        if (Object.prototype.toString.call(address.billing) != "[object Object]") {
            return res.status(400).send({status: false, message: "Billing Address should be of Object type"})
        }

        if (!address.billing.street) {
            return res.status(400).send({status: false, message: "Street of billing address is mandatory"})
        }
        if (!isValidString(address.billing.street)) {
            return res.status(400).send({status: false, message: "Street of billing address must be in string and cannot be empty"})
        }
        address.billing.street = address.billing.street.trim()

        if (!address.billing.city) {
            return res.status(400).send({status: false, message: "City of billing address is mandatory"})
        }
        if (!isValidString(address.billing.city)) {
            return res.status(400).send({status: false, message: "City of billing address must be in string and cannot be empty"})
        }
        address.billing.city = address.billing.city.trim()

        if (!address.billing.pincode) {
            return res.status(400).send({status: false, message: "Pincode of billing address is mandatory"})
        }
        if (typeof(address.billing.pincode) != "number") {
            return res.status(400).send({status: false, message: "Pincode of billing address must be in number"})
        }
        address.billing.pincode = address.billing.pincode.trim()
        if (!isValidPinCode(address.billing.pincode)) {
            return res.status(400).send({status: false, message: "Please enter a valid pincode for billing address. A valid pincode is of 6 digits and doesnot starts with 0"})
        }

        let newUser = await UserModel.create(data)
        return res.status(201).send({status: true, message: "User registered Successfullu!", data: newUser})
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = {createUser}