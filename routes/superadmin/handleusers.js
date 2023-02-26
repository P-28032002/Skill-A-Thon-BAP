const express = require('express');
const router = express.Router();
const crud = require('../crud');
const session = require('express-session');
const cookieParser = require('cookie-parser');
// Express Session has started

router.use(cookieParser());
router.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
// Express Session has ended



// AWS conginto Authentication declaration starts here

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AWS = require('aws-sdk');
const request = require('request');
const e = require('express');
global.fetch = require('node-fetch');

const poolData = {
    UserPoolId: "ap-south-1_9ErMvHoXm", // Your user pool id here
    ClientId: "521l6du1g1tn6pdbrt7j2ounqr" // Your client id here
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

router.post('/OnboardAdmin', (req,res)=>{
  var name = req.body.name;
  var gender = req.body.gender;
  var email = req.body.email;
  var desk = req.body.desk;
  crud.updateComplaint(complaint_id, {ministry: ministry, type: type});
  return res.status(200).send({"message": "Success"});
});

router.post('/createAdminAccount', (req, res) => {

    var attributeList = [];
    console.log(req.body.desk);
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "name", Value: req.body.name }));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "gender", Value: req.body.gender }));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:ministry", Value: req.body.ministry }));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:role", Value: req.body.desk }));


    userPool.signUp(req.body.email, "Admin@2022", attributeList, null, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        else {
            cognitoUser = result.user;
            console.log('user name is ' + cognitoUser.getUsername());
            console.log(JSON.stringify(cognitoUser));
            return res.status(200).send({"message": "Success"});
        }

    });
});

module.exports = router;
