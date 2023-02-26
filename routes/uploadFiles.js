const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { get } = require('express/lib/response');
const fs = require('fs')
const isLoggedIn = require('../middleware');

const s3 = new AWS.S3({
    accessKeyId: "AKIAUNTJLAUF4DV2WFHS",
    secretAccessKey: "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"
})
function uploadFilestoS3(file,cid) {
    var s3 = new AWS.S3();
    var params = {
        Bucket: 'complaint-bucket-sih',
        Key: cid+'.jpg',
        Body: file.data,
        ACL: 'public-read'
    };
    s3.upload(params, function(err, data) {
        if (err) {
            console.log(err);
            // callback(err);
        } else {
            console.log("Successfully uploaded data to S3");
            // callback(null, data);
        }
    }).on('httpUploadProgress', function(progress) {
        console.log(progress);
    });
}

function UploadCamera(file,cid) {
    var s3 = new AWS.S3();
    var params = {
        Bucket: 'complaint-bucket-sih',
        Key: cid+'.jpg',
        Body: file,
        ACL: 'public-read'
    };
    console.log(cid+"in upload cam");
    s3.upload(params, function(err, data) {
        if (err) {
            console.log(err);
            // callback(err);
        } else {
            console.log("Successfully uploaded data to S3");
            // callback(null, data);
        }
    }).on('httpUploadProgress', function(progress) {
        console.log(progress);
    });
}

// get object from the bucket

router.get('/saveImageToDir',isLoggedIn,async (req,res)=>{
    //get the image from s3
    let s3 = new AWS.S3();
    let params = {
        Bucket: 'complaint-bucket-sih',
        Key: '101471763.jpg'

    };
    await s3.getObject(params, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            // callback(null, data);
        }
    }).on('httpUploadProgress', function(progress) {
        console.log(progress);
    }).createReadStream().pipe(fs.createWriteStream('OCR_Images/'+req.session.user.idToken.payload.sub+'.jpg'));

})



module.exports = {
    router:router,
    uploadFilestoS3:uploadFilestoS3,
    UploadCamera:UploadCamera
};
