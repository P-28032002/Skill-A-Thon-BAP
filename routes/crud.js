const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware');
const userRole = require('../isUser');
// const AWS = require('aws-sdk');
const request = require('request');
const sms = require('./sendSms');
const sendemailto = require('./sendemail');
const multer = require("multer");
const fs = require('fs');
const store = require('store2');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../keys/firebase.json');


// const upload = require('../uploadFiles');

const firebaseConfig = {
  apiKey: "AIzaSyCeArzn1SYMXs064Kf9LzMwXBYA2UrXnqs",
  authDomain: "skillathon-93d74.firebaseapp.com",
  projectId: "skillathon-93d74",
  storageBucket: "skillathon-93d74.appspot.com",
  messagingSenderId: "557774966085",
  appId: "1:557774966085:web:8f977fc169e921b084422c",
  measurementId: "G-X2FWZB9LF4"
};

const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

// const {
//   initializeApp,
//   applicationDefault,
//   cert
// } = require('firebase-admin/app');
// const {
//   getFirestore,
//   Timestamp,
//   FieldValue
// } = require('firebase-admin/firestore');

// const serviceAccount = require('../keys/firebase.json');

initializeApp({
  credential: cert(serviceAccount)
});
// var admin = require('firebase-admin')

const db = getFirestore();
const upload = multer({storage: multer.memoryStorage()});

async function checkUserPresent(email, password) {
  console.log("Hello");
  console.log(email);
  console.log(password);
  var data=null;
  await db.collection("Users").where("email", "==", email).where("password", "==", password).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      // console.log(doc.data());
      if(doc.data() == null)
        data = null;
      else{
        data = { ...doc.data(), id: doc.id };
      }
    });
  })
  if(data == null)
      return false;
  store.setAll({id: data.id});
  console.log(store.get('id'));
  return true;
}

//insert Json
function insertItem(json, collection, doc) {
  if (doc == null) {
    db.collection(collection).add(json)
      .then(ref => {
        console.log('Added document with ID: ', ref.id);
      }).catch(err => {
        console.log('Error adding document: ', err);
      });
  } else {
    db.collection(collection).doc(doc).set(json)
      .then(ref => {
        console.log('Added document with ID: ', ref.id);
      }).catch(err => {
        console.log('Error adding document: ', err);
      });
  }
}

router.get('/Dashboard', async (req, res) => {
  var id = store.get('id');
  console.log(id);
  var userinfo;
  var notifications = [];
  await db.collection("Users").doc(id).get().then((doc) => {
    userinfo = doc.data();
  });

  // All API's for BAP Application
  var course_data = [];
  await db.collection("Courses").where("user_id", "==", id).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      // console.log(doc.data());
      var data = { ...doc.data(), id: doc.id };
      course_data.push(data);
    });
  })

  var course_enrolled = [];
  var courses_cnt = 0;
  db.collection("User_courses").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      if(doc.data().User_id == id)
      {
        console.log(doc.data());
        var docdata = { ...doc.data(), id: doc.id };
        course_enrolled.push(docdata);
      }
    });
  })

  //course_cnt = course_enrolled.length;
  //console.log(course_enrolled);
  //console.log(courses_cnt);
  // var course_info = [];
  // for(var i = 0;i<course_enrolled.length;i++)
  // {
  //   var course_name;
  //   await db.collection("Course").get().then((querySnapshot) => {
  //     querySnapshot.forEach((doc) => {
  //       if(doc.data().Course_id == course_enrolled[i].Course_id)
  //       {
  //         console.log(doc.data());
  //         var docdata = { ...doc.data(), id: doc.id };
  //         course_info.push(docdata);
  //       }
  //     });
  //   });
  // }

  //console.log(course_info);
  var total_courses = course_data.length;
  var enrollments = 0;
  var graph_data = [];
  for(var i=0;i<course_data.length;i++){
    enrollments = enrollments + course_data[i].enrolled_users;
    var data = { value: course_data[i].enrolled_users, name: course_data[i].name };
    graph_data.push(data);
  }
  var enrollments_per_course = 0;
  if(total_courses != 0){
    enrollments_per_course = enrollments/total_courses;
  }

  // console.log(graph_data);

  res.render('user/dashboard', {
    userData: userinfo, course_data: course_data,
    total_courses: total_courses, enrollments: enrollments,
    enrollments_per_course: enrollments_per_course, graph_data: graph_data, 
  });

})

router.post('/EnrollCourse', async(req, res) => {
    var id = store.get('id');
    console.log(id);
    const courseid = req.body.course_id;
    var courseEnrolled;
    var checkcourse;
    console.log(courseid);
    await db.collection("User_courses").where("Course_id", "==", courseid).where("User_id", "==", id).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        checkcourse = doc.data();
      })
    })
    
    if(!checkcourse)
    {
      insertItem({Course_id: courseid, User_id: id}, "User_courses", null);
    }

    await db.collection("Users").doc(id).get().then((doc) => {
      console.log(doc.data());
      userinfo = doc.data();
    });

    await db.collection("Courses").doc(courseid).get().then((doc) => {
      console.log(doc.data());
      courseEnrolled = doc.data();
    });

    const runRequestBody = {
      course_id: courseid
    };

    request.post({
      url: "http://127.0.0.1:3000/confirm",
      json: runRequestBody
    },
    function(error, response, body){

    });

    res.render('user/searchResult', {complaints: [],
      userData: userinfo, complaints: [],
      approved: 2, pending: 2,
      rejected: 2, notifications: [], courseId: courseid, course: courseEnrolled, flag: 1
})
})

router.get('/Search', async (req, res) => {
    var id = store.get('id');
    console.log(id);
    var userinfo;
    var notifications = [];
    var coursesEnrolled = [];
    await db.collection("Users").doc(id).get().then((doc) => {
      console.log(doc.data());
      userinfo = doc.data();
    });

    res.render('user/searchCourses', {
      userData: userinfo, complaints: [],
      approved: 2, pending: 2,
      rejected: 2, notifications: [], course: coursesEnrolled
    });
})

router.post('/submitQuery',async (req, res) => {
  var id = store.get('id');
  const searchquery = req.body.searchquery;
  console.log(searchquery);

  const runRequestBody = {
    query: searchquery
};

request.post({
    url: "http://127.0.0.1:3000/search",
    json: runRequestBody
},
function(error, response, body){
  console.log(body);
  console.log(response);
  var userinfo;
  db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
    console.log('before render')
    console.log(body.courses);
    res.render('user/searchCourses', {
      userData: userinfo, complaints: [],
      approved: 2, pending: 2,
      rejected: 2, notifications: [], course: body.courses
    });
  });
});

})

router.post('/on_search',async (req, res) => {
  var id = store.get('id');
  var courses = req.body.courses;
  console.log(courses);
  var userinfo;
  await db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });
  console.log('before render')
  console.log(courses);
    res.render('user/searchCourses', {
      userData: userinfo, complaints: [],
      approved: 2, pending: 2,
      rejected: 2, notifications: [], course: courses
    });
});

router.post('/select', async (req, res) => {
  var id = store.get('id');
  var courseid = req.body.course_id;

  const runRequestBody = {
    courseid: courseid
};

request.post({
    url: "http://127.0.0.1:3000/select",
    json: runRequestBody
},
function(error, response, body){
  var userinfo;
  var notifications = [];
  var courseEnrolled;
  db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });

  var flag = 0;

  db.collection("User_courses").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      if(doc.data().Course_id == courseid && doc.data().User_id == id)
      {
        flag = 1;
      }
    })
  })

   res.render('user/searchResult', {
    userData: userinfo, complaints: [],
    approved: 2, pending: 2,
    rejected: 2, notifications: [], courseId: courseid, course: body.course, flag: flag
  });
});

})

router.get('/SearchResult', async (req, res) => {
  var id = store.get('id');
  console.log(id);
  var userinfo;
  var notifications = [];
  var coursesEnrolled = [];
  await db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });

  await db.collection("Courses").doc(courseid).get().then((doc) => {
    console.log(doc.data());
    courseEnrolled = doc.data();
  });
  // res.render('user/searchResult', {
  //   userData: userinfo, complaints: [],
  //   approved: 2, pending: 2,
  //   rejected: 2, notifications: [], coursesnrolled: coursesEnrolled
  // });
})

router.post('/SelectCourse', async(req,res) =>{
  var id = store.get('id');
  const courseid = req.body.course_id;
  console.log(courseid)
  var userinfo;
  var notifications = [];
  var courseEnrolled;
  await db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });

  var flag = 0;
  await db.collection("Courses").doc(courseid).get().then((doc) => {
    console.log(doc.data());
    courseEnrolled = doc.data();
  });

  await db.collection("User_courses").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      if(doc.data().Course_id == courseid && doc.data().User_id == id)
      {
        flag = 1;
      }
    })
  })

  console.log(courseEnrolled);
   res.render('user/searchResult', {
    userData: userinfo, complaints: [],
    approved: 2, pending: 2,
    rejected: 2, notifications: [], courseId: courseid, course: courseEnrolled, flag: flag
  });
})

router.get('/videoPlayer',async (req,res) => {
  const range = req.headers.range
  console.log('VideoPlayer');
  console.log(req.query.id);
  const videoPath = req.query.id;
  const videoSize = fs.statSync(videoPath).size;
  const chunkSize = 1 * 1e6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + chunkSize, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4"
  }
  res.writeHead(206, headers)
  const stream = fs.createReadStream(videoPath, {
      start,
      end
  })
  stream.pipe(res)
})

/********************************************
 * Content Studio Start
 ********************************************/
router.post('/GenerateResponse', async (req,res) => {
  var id = store.get('id');
  console.log(req.body);
  const question = req.body.question;
  var response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: question,
    max_tokens: 1000
  });
  response = response.data.choices[0].text;
  console.log(response);
  var userinfo;
  await db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });
  res.render('user/ContentGPT', { userData: userinfo, question: question, response: response });
})

router.get('/ContentGPT', async (req,res) => {
  var id = store.get('id');
  var userinfo;
  await db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });
  const question = "What is Python Programming ?";
  const response = "Python is a high-level, interpreted, general-purpose programming language. It is an open source scripting language with easy to understand syntax and powerful libraries for data manipulation and analysis. Python can be used for web development, software development, mathematics, system scripting, and much more. Python is known for its readability and simple syntax which makes it easy to learn and use."
  res.render('user/ContentGPT', { userData: userinfo, question: question, response: response });
})

router.get('/TextToSpeech', async (req,res) => {
  var id = store.get('id');
  var userinfo;
  await db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });
  res.render('user/text_to_speech', {userData: userinfo});
})

router.get('/VideoGeneration', async (req,res) => {
  var id = store.get('id');
  var userinfo;
  await db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });
  res.render('user/video_generation', { userData: userinfo });
})

router.get('/VideoTranslation', async (req,res) => {
  var id = store.get('id');
  var userinfo;
  await db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });
  res.render('user/video_translation', { userData: userinfo });
})

router.post('/VideoTranslation', upload.single('video_name'), async (req,res) => {
  // var id = store.get('id');
  // console.log(req.file);
  // const storageRef = storage.ref(req.file.originalname);
  // await storageRef.put(req.file.buffer, {
  //   contentType: req.file.mimetype
  // })
  // const video_url = await storageRef.getDownloadURL()
  // console.log(video_url);
  // await extractAudio({
  //   input: video_url,
  //   output: 'test.wav'
  // })
  // var buffer = await fs.readFileSync('test.wav');
  // const audioRef = storage.ref('test'+Date.now()+'.wav');
  // await audioRef.put(buffer, {
  //   contentType: 'audio/x-wav',
  // })
  // const audio_url = await audioRef.getDownloadURL();
  // console.log(req.body);

  // console.log(audio_url);
  // const runRequestBody = {
  //     audio_url: audio_url,
  //     reference_language: req.body.ref_language,
  //     target_language: req.body.tar_language
  // };
   res.redirect('/VideoTranslation');
})
/********************************************
 * Content Studio End
 ********************************************/

module.exports = {
  router: router,
  insertItem: insertItem,
  checkUserPresent: checkUserPresent
};
