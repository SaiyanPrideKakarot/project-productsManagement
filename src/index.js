const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')

const app = express()

const router = require('./routes/route')

app.use(express.json())
app.use(multer().any())

mongoose.connect("mongodb+srv://kakarot:7r9d5ckARYXY2cDi@cluster0.ecdqowc.mongodb.net/group03Database?retryWrites=true&w=majority", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDB is Connected"))
    .catch(error => console.log(error))

app.use('/', router)

app.use(function (req, res) {
    return res.status(404).send({ status: false, message: "Url not found" })
})

app.listen(process.env.PORT || 3000, function () {
    console.log("Express app is running on port " + (process.env.PORT || 3000))
})