const mongoose = require("mongoose")

const isValidString = function (value) {
    if (typeof value === "undefined" || value === null || typeof value !== "string" || value.trim().length == 0) {
        return false
    }
    return true
}

const isValidName = function (value) {
    const nameRegex = /^[A-Za-z]+$/
    return nameRegex.test(value)
}

const isValidEmail = (email) => {
    const emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
    return emailRegex.test(email)
}

const isValidPhone = function (value) {
    const phoneRegex = /^[6789]\d{9}$/
    return phoneRegex.test(value)
}

const isValidPassword = function (value) {
    const passwordRegex = /^[a-zA-Z0-9!@#$%^&*]{8,15}$/
    return passwordRegex.test(value)
}

const isValidPinCode = function (value) {
    const pincodeRegex = /^[1-9][0-9]{5}$/
    return pincodeRegex.test(value)
}

const isValidImage = function (value) {
    const imageRegex = /image\/png|image\/jpeg|image\/jpg/
    return imageRegex.test(value)
}

const isValidObjectId = function (value) {
    if (mongoose.Types.ObjectId.isValid(value)) {
        return true
    } else {
        return false
    }
}

const isValidNumber = function (value) {
    if (typeof value == "number") {
        return true
    } else {
        return false
    }
}

const isValidBoolean = function (value) {
    if (typeof value == "boolean") {
        return true
    } else {
        return false
    }
}

const isValidSizes = function (value) {
    if (value.every((e) => ["S", "XS", "M", "X", "L", "XXL", "XL"].includes(e))) {
        return true
    } else {
        return false
    }
}

// const isValidSizes = function (value) {
//     value = value.split(",").map((s) => s.trim().toUpperCase())
//     if (value.every((e) => ["S", "XS", "M", "X", "L", "XXL", "XL"].includes(e))) {
//         return true
//     } else {
//         return false
//     }
// }

const isNumberWithoutDecimal = function (value) {
    let regex = /^\d+$/
    return regex.test(value)
}

const isValidRemoveProduct = function (value) {
    if ((value == 0) || (value == 1)) {
        return true
    } else {
        return false
    }
}

const isValidStatus = function (value) {
    if (value.every((e) => ["pending", "completed", "cancelled"].includes(e))) {
        return true
    } else {
        return false
    }
}


module.exports = { isValidString, isValidName, isValidEmail, isValidPhone, isValidPassword, isValidPinCode, isValidImage, isValidObjectId, isValidNumber, isValidBoolean, isValidSizes, isNumberWithoutDecimal, isValidRemoveProduct, isValidStatus }