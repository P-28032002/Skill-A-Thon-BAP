const { DataBrew } = require('aws-sdk');
const express = require('express');
const router = express.Router();
const userRole = require('../../isUser');
const store = require('store2');
const {initializeApp} = require('firebase/app');
const {getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, query, where} = require('firebase/firestore')
const firebaseConfig = {
    apiKey: "AIzaSyCeArzn1SYMXs064Kf9LzMwXBYA2UrXnqs",
    authDomain: "skillathon-93d74.firebaseapp.com",
    projectId: "skillathon-93d74",
    storageBucket: "skillathon-93d74.appspot.com",
    messagingSenderId: "557774966085",
    appId: "1:557774966085:web:ea43072771061aef84422c",
    measurementId: "G-ZZY1Y3ZLJQ"
};
  
// Initialize Firebase
initializeApp(firebaseConfig);

const db = getFirestore();

router.get('/ViewProfile', async (req,res)=>{
    //console.log(req.session.user.idToken);
    let record = []
    console.log(store('email'));
    //const doc = db.collection('Users').where('email', '==', store('email')).get();
    // const getAll = db.collection('Users').get();
    // console.log(getAll.data());
    // if (!doc.exists) {
    // console.log('No such document!');
    // } else {
    // console.log('Document data:', doc.data());
    // }
    const colRef = collection(db, 'Users');
    const q = query(colRef, where("email", "==", store('email')))
    await onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach((doc) => {
            record.push({ ...doc.data(), id: doc.id})
        })
        console.log(record)
        res.render('user/viewprofile',{info: record});
    })
})
module.exports = router;
