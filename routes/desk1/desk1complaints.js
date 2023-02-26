const express = require('express');
const isLoggedIn = require('../../middleware');
const crud = require('../crud');
const router = express.Router();

router.post('/UpdateComplaint', (req,res)=>{
  var complaint_id = req.body.id;
  var ministry = req.body.ministry;
  var type = req.body.type;
  crud.updateComplaint(complaint_id, {ministry: ministry, type: type});
  return res.status(200).send({"message": "Success"});
});


module.exports = router;
