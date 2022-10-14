const aws = require('aws-sdk')

aws.config.update({
    accessKeyId: "AKIAY3L35MCRZNIRGT6N",
    secretAccessKey: "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",
    region: "ap-south-1"
})
let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        let s3 = new aws.S3({ apiVersion: "2006-03-01" })
        let uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "project5Group03/profileImages/" + file.originalname,
            Body: file.buffer
        }
        s3.upload(uploadParams, function (error, data) {
            if (error) {
                return reject({ "error": error })
            }
            // console.log(data)
            console.log("File Uploaded Successfully")
            return resolve(data.Location)
        })
    })
}

module.exports = { uploadFile }