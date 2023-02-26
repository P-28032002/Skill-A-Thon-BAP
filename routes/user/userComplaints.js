const express = require('express');
const isLoggedIn = require('../../middleware');
const router = express.Router();
const crud = require('../crud');
const upload = require('../uploadFiles');
const fileUpload = require('express-fileupload')
const path = require('path')
const request = require('request');
const userRole = require('../../isUser');
const AWS = require('aws-sdk');



router.use(
  fileUpload({
    limits: { fileSize: 2 * 1024 * 1024 },
  })
)


router.post('/LodgeComplaint', userRole.isUser, (req, res) => {
 
  console.log("Lodge Complaint");
  var complaint_summary = "";
  if(req.body.ComplaintBody == ""){
    complaint_body = "We celebrate Independence Day as the national festival of India. The Day marks\nthe anniversary of national independence from the British Empire on 15th august\n1947. Furthermore, it is the most auspicious day for the people of India because\nIndia becomes independent after lots of hardships and sacrifices of the brave\nIndian freedom fighters. The entire nation celebrates this day with the full spirit of\n\npatriotism.\n"
  }
  const runRequestBody = {
    text: req.body.ComplaintBody
  };

  request.post({
    url: "http://40.117.125.57:8000/text-summarizer/",
    // url: "http://127.0.0.1:8000/text-summarizer/",
    json: runRequestBody
  },
    function (error, response, body) {
      console.log("Error", error);
      JSON.stringify(body);
      console.log("Body", body);
      complaint_summary = body.extracted_text;

      const similarityRequestBody = {
        text: req.body
      }
      complaintData = {
        ComplaintBody: req.body.ComplaintBody,
        UID: req.session.user.idToken.payload.sub,
        Employer: req.body.Employer,
        type: req.body.type,
        comments: [],
        ComplaintSummary: complaint_summary,
        // complaint_file: req.files.complaint_file.name,
        additional_file: req.files.additional_file.name,
        current_desk: "Desk 1",
        status: "Pending",
        ministry: req.body.ministry
      }

      const file = req.files.complaint_file;
      const file1 = req.files.additional_file;
      console.log(file);
      try {
        if(file != null){
          upload.uploadFilestoS3(file,req.session.user.idToken.payload.sub,1);
        }
        if(file1 != null){
          upload.uploadFilestoS3(file1,req.session.user.idToken.payload.sub,2);
        }
        console.log(file);
      } catch (error) {
      }
      // upload the camera image to s3
      try {
      var buf= req.body.CamImage;
      upload.UploadCamera(buf,req.session.user.idToken.payload.sub);
    } catch (error) {
    }

      crud.insertComplaint(req.session.user.idToken.payload.sub, complaintData, req.files.complaint_file,  req.files.additional_file);
      res.redirect('/Dashboard');
    });

  try {
        var buf= req.body.websnap;
        // console.log(buf);
      //  convert the base64 image to buffer
        var buffer1 = Buffer.from(buf, 'base64');
        // console.log(buffer1);
        upload.UploadCamera(buffer1,req.session.user.idToken.payload.sub);
      } catch (error) {
      }
})


router.post('/AddComment', isLoggedIn, (req, res) => {
  if(req.session.user.idToken.payload["custom:role"]=="user"){
    crud.addComment(req.body.cid, req.session.user.idToken.payload.sub, req.body.comment);
    res.redirect('/GetFullComplaint?cid=' + req.body.cid);
  }
  else{
    crud.addComment(req.body.cid, req.session.user.idToken.payload.sub, req.body.comment, "desk1");
    res.redirect('/GetFullComplaintAdmin1?cid=' + req.body.cid);
  }
})






module.exports = router;
