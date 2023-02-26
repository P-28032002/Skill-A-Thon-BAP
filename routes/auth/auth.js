const express = require('express');
const router = express.Router();
const crud = require('../crud');
const isLoggedIn = require('../../middleware');

const request = require('request');
const e = require('express');
const { json } = require('body-parser');
const { insertItem } = require('../crud');
const store = require("store2");

router.post('/Signup', async (req, res) => {

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const gender = req.body.gender;
    const age = req.body.age;
    const aadhar = req.body.aadhar;
    const phone = req.body.phone;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const country = req.body.country;
    const pincode = req.body.pincode;
    console.log("In Signup");
    const flag = await crud.checkUserPresent(email, password);
    if(flag == false){
        insertItem({"name": name, "email": email, "password": password, "gender": gender, "age": age, "aadhar": aadhar, "phone": phone, "address": address, "city": city, "state": state, "country": country, "pincode": pincode}, "Users", null);
    }
    res.redirect('/Login');
});


router.post('/Login', async (req, res) => {
    console.log("In Login");
    const email = req.body.email;
    const password = req.body.password;
    const flag = await crud.checkUserPresent(email, password);
    console.log(flag);
    if(flag == true)
    {
        console.log("Valid User");
        store.setAll({email: email, password: password});
        //console.log('This is data of store');
        //console.log(store('email'));
        res.redirect('/Dashboard');
    }
})

// function errorinLogin(res) {
//     res.send(`
//     <!DOCTYPE html>
// <html lang="en">

// <head>
// <meta charset="utf-8">
// <meta content="width=device-width, initial-scale=1.0" name="viewport">

// <title>Login</title>
// <meta content="" name="description">
// <meta content="" name="keywords">

// <!-- Favicons -->
// <link href="assets/img/favicon.png" rel="icon">
// <link href="assets/img/apple-touch-icon.png" rel="apple-touch-icon">

// <!-- Google Fonts -->
// <link href="https://fonts.gstatic.com" rel="preconnect">
// <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i" rel="stylesheet">

// <!-- Vendor CSS Files -->
// <link href="assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
// <link href="assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">
// <link href="assets/vendor/boxicons/css/boxicons.min.css" rel="stylesheet">
// <link href="assets/vendor/quill/quill.snow.css" rel="stylesheet">
// <link href="assets/vendor/quill/quill.bubble.css" rel="stylesheet">
// <link href="assets/vendor/remixicon/remixicon.css" rel="stylesheet">
// <link href="assets/vendor/simple-datatables/style.css" rel="stylesheet">

// <link href="assets/css/style.css" rel="stylesheet">

// </head>

// <body>

// <!--Start of Tawk.to Script-->
// <script type="text/javascript">
// var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
// (function(){
// var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
// s1.async=true;
// s1.src='https://embed.tawk.to/6305f3ee54f06e12d8907185/1gb7k1oaj';
// s1.charset='UTF-8';
// s1.setAttribute('crossorigin','*');
// s0.parentNode.insertBefore(s1,s0);
// })();
// </script>
// <!--End of Tawk.to Script-->

// <main>
// <div class="container">

// <section class="section register min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
// <div class="container">
// <div class="row justify-content-center">
// <div class="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">

//   <div class="d-flex justify-content-center py-4">
//     <a href="/UserDashbord" class="logo d-flex align-items-center w-auto">
//       <img src="assets/img/logo.png" alt="">
//       <span class="d-block ">Yukti</span>
//     </a>
//   </div><!-- End Logo -->

//   <div class="card mb-3">

//     <div class="card-body">

//       <div class="pt-4 pb-2">
//         <h5 class="card-title text-center pb-0 fs-4">Login to Your Account</h5>
//         <p class="text-center small">Enter your Email & password to login</p>
//       </div>

//       <!-- changes made M-->
//       <form action="/Login" method="post" class="row g-3 needs-validation" novalidate >

//         <div class="col-12">
//           <label for="yourUsername" class="form-label">Username</label>
//           <div class="input-group has-validation">

//             <!-- changes made M-->
//             <input type="text" name="email" class="form-control" id="Email" required placeholder="Email">
//             <div class="invalid-feedback">Please enter your Email.</div>
//           </div>
//         </div>

//         <div class="col-12">
//           <label for="yourPassword" class="form-label">Password</label>

//           <!-- changes made M-->
//           <input  type="password" name="password" placeholder="Password" class="form-control" id="yourPassword" required >
//           <div class="invalid-feedback">Please enter your password!</div>
//         </div>

//         <div class="col-12">
//             <label for="yourPassword" class="form-label" style="color: red;">Invalid User</label>
//             <button class="btn btn-primary w-100" type="submit" value="Send">Login</button>
//         </div>
//         <div class="col-12">
//           <p class="small mb-0">Don't have account? <a href="/Signup">Create an account</a></p>
//           <p class="small mb-0"><a href="/ForgotPassword">Forgot Password</a></p>
//         </div>
//       </form>

//     </div>
//   </div>

// </div>
// </div>
// </div>

// </section>

// </div>
// </main><!-- End #main -->

// <a href="#" class="back-to-top d-flex align-items-center justify-content-center"><i class="bi bi-arrow-up-short"></i></a>

// <!-- Vendor JS Files -->
// <script src="assets/vendor/apexcharts/apexcharts.min.js"></script>
// <script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
// <script src="assets/vendor/chart.js/chart.min.js"></script>
// <script src="assets/vendor/echarts/echarts.min.js"></script>
// <script src="assets/vendor/quill/quill.min.js"></script>
// <script src="assets/vendor/simple-datatables/simple-datatables.js"></script>
// <script src="assets/vendor/tinymce/tinymce.min.js"></script>
// <script src="assets/vendor/php-email-form/validate.js"></script>

// <!-- Template Main JS File -->
// <script src="assets/js/main.js"></script>

// </body>

// </html>
// `)
// }


// router.post('/ConfirmUser', (req, res) => {
//     console.log(req.body.email)
//     console.log(req.body.code)

//     var userData = {
//         Username: req.body.email, // your username here
//         Pool: userPool
//     };
//     console.log(userPool);
//     var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
//     cognitoUser.confirmRegistration(req.body.code, true, function (err, result) {
//         if (err) {
//             res.json(err);
//             return;
//         }
//         else {
//             console.log("User Confirmed");
//             //res.json(result);
//             res.redirect('/Login');
//         }
//     }
//     );
// })

// //forgot password
// router.post('/ForgotPassword', (req, res) => {
//     console.log(req.body.email)
//     var userData = {
//         Username: req.body.email, // your username here
//         Pool: userPool
//     };
//     var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
//     cognitoUser.forgotPassword({
//         onSuccess: function (result) {
//             console.log('Forgot Password Success => \n');
//             res.redirect('/ConfirmPassword?email=' + req.body.email);
//         }
//         ,
//         onFailure: function (err) {
//             console.log('Forgot Password Failure => \n', err);
//             res.send(err);
//         }
//     });
// })


// // function to confirm forgotted password
// router.post('/ConfirmForgotPassword', (req, res) => {
//     var userData = {
//         Username: req.body.email, // your username here
//         Pool: userPool
//     };
//     var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
//     cognitoUser.confirmPassword(req.body.code, req.body.password, {
//         onSuccess: function (result) {
//             console.log('Confirm Password Success => \n', result);
//             res.redirect('/Login');
//         },
//         onFailure: function (err) {
//             console.log('Confirm Password Failure => \n', err);
//             res.send(err);
//         }
//     });
// })

// var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18', region: 'ap-south-1' });
// router.get('/Resendotp', (req, res) => {
//     var params = {
//         ClientId: '521l6du1g1tn6pdbrt7j2ounqr', /* required */
//         Username: req.query.email, /* required */

//     };
//     cognitoidentityserviceprovider.resendConfirmationCode(params, function (err, data) {
//         if (err) console.log(err, err.stack); // an error occurred
//         else {
//             res.redirect('/ConfirmOTP?email=' + req.query.email);
//         }          // successful response
//     });
// })

// //Change password
// router.get('/ChangePassword', isLoggedIn, (req, res) => {
//     res.redirect('/ChangeUserPassword');
// })

// router.get('/SendOTP', (req, res) => {
//     var userData = {
//         Username: req.session.user.idToken.payload.email, // your username here
//         Pool: userPool
//     };
//     var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
//     cognitoUser.forgotPassword({
//         onSuccess: function (result) {
//             console.log('Forgot Password Success => \n');
//         }
//         ,
//         onFailure: function (err) {
//             console.log('Forgot Password Failure => \n', err);
//             res.send(err);
//         }
//     });
// })

// router.post('/EditUser', async (req, res) => {

//     userData = {
//         Email: req.body.Email,
//         Name: req.body.Name,
//         Phone: req.body.Mobile,
//         Gender: req.body.Gender,
//         Aadhar: req.body.Aadhar,
//         Address: req.body.Address,
//         City: req.body.City,
//         State: req.body.State,
//         Country: req.body.Country,
//         Pincode: req.body.Pincode,
//         Age: req.body.Age
//     }

//     const cognitoClient = new AWS.CognitoIdentityServiceProvider();
//     crud.updateUser(req.session.user.idToken.payload.sub, userData);
//     await cognitoClient.adminUpdateUserAttributes(params).promise().then(data => {
//         res.redirect("/Login");
//     }).catch(err => {
//         res.send(err);
//     });
// });

module.exports = router;
