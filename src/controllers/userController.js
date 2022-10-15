const UserModel = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")

const { isValidString, isValidName, isValidEmail, isValidPhone, isValidPassword, isValidPinCode, isValidImage, isValidObjectId } = require('../validations/validators')
const { uploadFile } = require('../controllers/awsController')

const createUser = async function (req, res) {
    try {
        let data = req.body
        let { fname, lname, email, phone, password, address } = data
        let profileImage = req.files

        if ((Object.keys(data).length == 0) && !profileImage) {
            return res.status(400).send({ status: false, message: "Please provide appropriate details" })
        }

        if (!fname) {
            return res.status(400).send({ status: false, message: "First Name is required" })
        }
        fname = fname.trim()
        if (!isValidName(fname)) {
            return res.status(400).send({ status: false, message: "Please enter a valid First Name" })
        }

        if (!lname) {
            return res.status(400).send({ status: false, message: "Last Name is required" })
        }
        lname = lname.trim()
        if (!isValidName(lname)) {
            return res.status(400).send({ status: false, message: "Please enter a valid Last Name" })
        }

        if (!email) {
            return res.status(400).send({ status: false, message: "Email address is required" })
        }
        email = email.trim().toLowerCase()
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Please enter a valid email" })
        }
        let notUniqueEmail = await UserModel.findOne({ email: email })
        if (notUniqueEmail) {
            return res.status(400).send({ status: false, message: `User with email address: ${email} already exists` })
        }

        if (!phone) {
            return res.status(400).send({ status: false, message: "Phone Number is mandatory" })
        }
        phone = phone.trim()
        if (!isValidPhone(phone)) {
            return res.status(400).send({ status: false, message: "Please provide a valid Indian phone number" })
        }
        let notUniquePhone = await UserModel.findOne({ phone: phone })
        if (notUniquePhone) {
            return res.status(400).send({ status: false, message: `User with Phone No. ${phone} already exists` })
        }

        if (!password) {
            return res.status(400).send({ status: false, message: "Password is mandatory" })
        }
        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, message: "Password must be atlease 8 characters and maximum 15 characters" })
        }
        let encrypt = bcrypt.hash(password, 10, function (err, hash) {
            password = hash
        })

        if (address) {
            try {
                address = JSON.parse(address)
                if (address.shipping) {
                    if (!address.shipping.street) {
                        return res.status(400).send({ status: false, message: "Street of shipping address is mandatory" })
                    }
                    if (!isValidString(address.shipping.street)) {
                        return res.status(400).send({ status: false, message: "Street of shipping address must be in string." })
                    }
                    address.shipping.street = address.shipping.street.trim()

                    if (!address.shipping.city) {
                        return res.status(400).send({ status: false, message: "City of shipping address is mandatory" })
                    }
                    if (!isValidString(address.shipping.city)) {
                        return res.status(400).send({ status: false, message: "City of shipping address must be in string and cannot be empty" })
                    }
                    address.shipping.city = address.shipping.city.trim()

                    if (!address.shipping.pincode) {
                        return res.status(400).send({ status: false, message: "Pincode of shipping address is mandatory" })
                    }
                    if (typeof (address.shipping.pincode) != "number") {
                        return res.status(400).send({ status: false, message: "Pincode of shipping address must be in number" })
                    }
                    if (!isValidPinCode(address.shipping.pincode)) {
                        return res.status(400).send({ status: false, message: "Please enter a valid pincode for shipping address. A valid pincode is of 6 digits and doesnot starts with 0" })
                    }
                } else {
                    return res.status(400).send({ status: false, message: "Shipping address is a mandatory field" })
                }

                if (address.billing) {
                    if (!address.billing.street) {
                        return res.status(400).send({ status: false, message: "Street of billing address is mandatory" })
                    }
                    if (!isValidString(address.billing.street)) {
                        return res.status(400).send({ status: false, message: "Street of billing address must be in string and cannot be empty" })
                    }
                    address.billing.street = address.billing.street.trim()

                    if (!address.billing.city) {
                        return res.status(400).send({ status: false, message: "City of billing address is mandatory" })
                    }
                    if (!isValidString(address.billing.city)) {
                        return res.status(400).send({ status: false, message: "City of billing address must be in string and cannot be empty" })
                    }
                    address.billing.city = address.billing.city.trim()

                    if (!address.billing.pincode) {
                        return res.status(400).send({ status: false, message: "Pincode of billing address is mandatory" })
                    }
                    if (typeof (address.billing.pincode) != "number") {
                        return res.status(400).send({ status: false, message: "Pincode of billing address must be in number" })
                    }
                    if (!isValidPinCode(address.billing.pincode)) {
                        return res.status(400).send({ status: false, message: "Please enter a valid pincode for billing address. A valid pincode is of 6 digits and doesnot starts with 0" })
                    }
                } else {
                    return res.status(400).send({ status: false, message: "Billing address is a mandatory field" })
                }
            } catch (error) {
                console.log(error)
                return res.status(400).send({ status: false, message: `Invalid object or unable to parse in object. Please provide valid object (Hint:First digit of Number field cannot contain 0 and string field must be inside "")` })
            }

        } else {
            return res.status(400).send({ status: false, message: "Address is a mandatory field" })
        }
        if (profileImage.length === 0) {
            return res.status(400).send({ status: false, message: "Please upload profile image" })
        }
        if (profileImage.length > 1) {
            return res.status(400).send({ status: false, message: "You can upload only one image in Profile Image" })
        }
        if (!isValidImage(profileImage[0].mimetype)) {
            return res.status(400).send({ status: false, message: "Invalid image type. Only jpg, png, jpeg image type are accepted." })
        }

        let uploadedImageUrl = await uploadFile(profileImage[0])
        profileImage = uploadedImageUrl

        let newData = {
            fname: fname,
            lname: lname,
            email: email,
            profileImage: profileImage,
            phone: phone,
            password: password,
            address: address
        }

        let newUser = await UserModel.create(newData)
        return res.status(201).send({ status: true, message: "User registered Successfullu!", data: newUser })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }
}


const loginUser = async function (req, res) {
    try {
        let data = req.body
        if (Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, message: "Request body cannnot be empty" });
        }
        if (Object.keys(data).length > 2) {
            return res.status(400).send({ status: false, message: "Request body must have email and password only" });
        }
        let { email, password } = req.body;
        if (!email) {
            return res.status(400).send({ status: false, message: "Email is mandatory" })
        }
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Please enter valid email address" })
        }
        if (!password) {
            return res.status(400).send({ status: false, message: "Password is mandatory" })
        }

        let user = await UserModel.findOne({ email: email.trim() });
        if (!user) {
            return res.status(400).send({ status: false, message: "Email is not correct", });
        }

        let comparedPassword = bcrypt.compareSync(password.trim(), user.password)
        if (!comparedPassword) {
            return res.status(400).send({ status: false, message: "Password is not correct" });
        }
        let payload = {
            userId: user._id.toString(),
            batch: "plutonium",
            organisation: "FunctionUp",
        }
        let token = jwt.sign(payload, "Project5-group03", { expiresIn: '24h' });
        const finalData = {
            userId: user._id.toString(),
            token: token
        };
        res.setHeader("Authorization", token)
        return res.status(201).send({ status: true, message: "User login successfully", data: finalData });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


const getUserProfile = async function (req, res) {
    try {
        let userId = req.params.userId;

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" })
        }

        let decodedToken = req.decodedToken
        if (userId != decodedToken.userId) {
            return res.status(403).send({ status: false, message: "User is not allowed to view others profile" })
        }

        let userProfile = await UserModel.findById(userId);
        if (userProfile) {
            return res.status(200).send({ status: false, message: "Success", data: userProfile });
        } else {
            return res.status(404).send({ status: false, message: "User not Found" });
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


const updateAPI = async function (req, res) {
    try {

        let userId = req.params.userId
        let data = req.body
        let { fname, lname, email, phone, password, profileImage, address } = data
        let file = req.files
        // let { shipping, billing } = data.address

        let obj = {};
        if (fname) {
            fname = fname.trim()
            if (!isValidName(fname)) {
                return res.status(400).send({ status: false, message: "Please enter a valid firstname" })
            }
            obj.fname = fname;
        }
        if (lname) {
            lname = lname.trim()
            if (!isValidName(lname)) {
                return res.status(400).send({ status: false, message: "Please enter a valid lastname" })
            }
            obj.lname = lname;
        }
        if (email) {
            email = email.trim().toLowerCase()
            if (!isValidEmail(email)) {
                return res.status(400).send({ status: false, message: "Please enter a valid email" })
            }
            let notUniqueEmail = await UserModel.findOne({ email: email })
            if (notUniqueEmail) {
                return res.status(400).send({ status: false, message: `User with email address: ${email} already exists` })
            }
            obj.email = email;
        }
        if (phone) {
            phone = phone.trim()
            if (!isValidPhone(phone)) {
                return res.status(400).send({ status: false, message: "Please provide a valid phone number" })
            }
            let notUniquePhone = await UserModel.findOne({ phone: phone })
            if (notUniquePhone) {
                return res.status(400).send({ status: false, message: `User with Phone: ${phone} already exists` })
            }
            obj.phone = phone;
        }
        if (password) {
            if (!isValidPassword(password)) {
                return res.status(400).send({ status: false, message: "Password must be atlease 8 characters and maximum 15 characters" })
            }
            let encrypt = await bcrypt.hash(password, 10)
            password = encrypt
            obj.password = password
        }
        if (profileImage) {
            if (file.length > 1) {
                return res.status(400).send({ status: false, message: "You can upload only one image in Profile Image" })
            }
            if (!isValidImage(file[0].mimetype)) {
                return res.status(400).send({ status: false, message: "Invalid image type. Only jpg, png, jpeg, gif, jfif image type are accepted." })
            }
            let uploadedImageUrl = await uploadFile(file[0])
            obj.profileImage = uploadedImageUrl;
        }
        if (address) {
            try {
                address = JSON.parse(address)
            if (address.shipping) {
                if (!address.shipping.street) {
                    return res.status(400).send({ status: false, message: "Street of shipping address is mandatory" })
                }
                if (!isValidString(address.shipping.street)) {
                    return res.status(400).send({ status: false, message: "Street of shipping address must be in string and cannot be empty" })
                }
                address.shipping.street = address.shipping.street.trim()

                if (!address.shipping.city) {
                    return res.status(400).send({ status: false, message: "City of shipping address is mandatory" })
                }
                if (!isValidString(address.shipping.city)) {
                    return res.status(400).send({ status: false, message: "City of shipping address must be in string and cannot be empty" })
                }
                address.shipping.city = address.shipping.city.trim()

                if (!address.shipping.pincode) {
                    return res.status(400).send({ status: false, message: "Pincode of shipping address is mandatory" })
                }
                if (typeof (address.shipping.pincode) != "number") {
                    return res.status(400).send({ status: false, message: "Pincode of shipping address must be in number" })
                }
                // address.shipping.pincode = address.shipping.pincode.trim()
                if (!isValidPinCode(address.shipping.pincode)) {
                    return res.status(400).send({ status: false, message: "Please enter a valid pincode for shipping address. A valid pincode is of 6 digits and doesnot starts with 0" })
                }
                address.shipping.pincode = address.shipping.pincode
            } else {
                return res.status(400).send({ status: false, message: "Shipping address is a mandatory field" })
            }

            if (address.billing) {
                if (!address.billing.street) {
                    return res.status(400).send({ status: false, message: "Street of billing address is mandatory" })
                }
                if (!isValidString(address.billing.street)) {
                    return res.status(400).send({ status: false, message: "Street of billing address must be in string and cannot be empty" })
                }
                address.billing.street = address.billing.street.trim()

                if (!address.billing.city) {
                    return res.status(400).send({ status: false, message: "City of billing address is mandatory" })
                }
                if (!isValidString(address.billing.city)) {
                    return res.status(400).send({ status: false, message: "City of billing address must be in string and cannot be empty" })
                }
                address.billing.city = address.billing.city.trim()

                if (!address.billing.pincode) {
                    return res.status(400).send({ status: false, message: "Pincode of billing address is mandatory" })
                }
                if (typeof (address.billing.pincode) != "number") {
                    return res.status(400).send({ status: false, message: "Pincode of billing address must be in number" })
                }
                // address.billing.pincode = address.billing.pincode.trim()
                if (!isValidPinCode(address.billing.pincode)) {
                    return res.status(400).send({ status: false, message: "Please enter a valid pincode for billing address. A valid pincode is of 6 digits and doesnot starts with 0" })
                }
                address.billing.pincode = address.billing.pincode
            } else {
                return res.status(400).send({ status: false, message: "Billing address is a mandatory field" })
            }
            } catch (error) {
                console.log(error)
                return res.status(400).send({ status: false, message: `Invalid object or unable to parse in object. Please provide valid object (Hint:First digit of Number field cannot contain 0 and string field must be inside "")` })
            }
            obj.address = address
        }
        let savedData = await UserModel.findOneAndUpdate({ _id: userId }, {$set: obj}, { new: true });
        if (!savedData) {
            return res.status(404).send({ status: false, msg: "User not found" });
        }
        return res.status(200).send({ status: true, data: savedData });
    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, msg: "Error", error: err.message });
    }
}


module.exports = { createUser, loginUser, getUserProfile, updateAPI }