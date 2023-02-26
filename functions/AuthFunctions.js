const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AWS = require('aws-sdk');
const request = require('request');
// const jwkToPem = require('jwk-to-pem');
// const jwt = require('jsonwebtoken');
global.fetch = require('node-fetch');


const poolData = {    
    UserPoolId : "ap-south-1_5KPHSxbX6", // Your user pool id here    
    ClientId : "68h5h635jo0282a7pl2cnjnpd7" // Your client id here
    }; 

    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// Create user Function
function RegisterUser(name,email,phone,password){
        var attributeList = [];
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"name",Value:name}));
        // attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"preferred_username",Value:"jay"}));
        // attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"gender",Value:"male"}));
        // attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"birthdate",Value:"1991-06-21"}));
        // attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"address",Value:"CMB"}));
        // attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"email",Value:"sampleEmail@gmail.com"}));
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"phone_number",Value:phone}));
        // attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"custom:scope",Value:"admin"}));
    
        userPool.signUp(email, password, attributeList, null, function(err, result){
            if (err) {
                console.log(err);
                return;
            }
            cognitoUser = result.user;
            console.log('user name is ' + cognitoUser.getUsername());
        });
}


//confirm user with otp code
function ConfirmUser(email,code){
    var userData = {
        Username : email, // your username here
        Pool : userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(code, true, function(err, result) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('call result: ' + result);
    }
    );
}


// Login user Function
function LoginUser(email,password){
    var authenticationData = {
        Username : email, // your username here
        Password : password, // your password here
    };
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    var userData = {
        Username : email, // your username here
        Pool : userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
           console.log('Login success => \n',result);
        },
        onFailure: function(err) {
            console.log(err);
        }
    });
}


// Get user details
function GetUserDetails(){
    var userData = {
        Username : 'prgayake100@gmail.com', // your username here
        Pool : userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.getUserAttributes(function(err, result) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('call result: ' + result);
    }   
    );
}
GetUserDetails();
