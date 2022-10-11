const isValidString = function (value) {
    if (typeof value === "undefined" || value === null || typeof value !== "string" || value.trim().length == 0) {
        return false
    }
    return true
}

const isValidName = function (value) {
    const nameRegex = /^\S+\w{8,32}\S{1,}/
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
    const imageRegex = /.+\.(?:(jpg|gif|png|jpeg|jfif))/
    return imageRegex.test(value)
}

module.exports = { isValidString, isValidName, isValidEmail, isValidPhone, isValidPassword, isValidPinCode, isValidImage }