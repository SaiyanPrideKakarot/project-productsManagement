const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const app = express()

const router = require('./routes/route')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

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