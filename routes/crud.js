const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware');
const userRole = require('../isUser');
// const AWS = require('aws-sdk');
const request = require('request');
const sms = require('./sendSms');
const sendemailto = require('./sendemail');
const multer = require("multer");
const fileUpload = require('express-fileupload')
const fs = require('fs');

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

var id="";

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
  id = data.id;
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


//check is first time login
async function checkFirstTimeLogin(json, uid) {
  await db.collection('users').doc(uid).get()
    .then(doc => {
      if (!doc.exists) {
        console.log("first time login");
        insertItem(json, 'users', uid);
      }
    }).catch(err => {
      console.log('Error getting document', err);
    });
}



async function insertComplaint(uid, json) {
  json["Time"] = admin.firestore.Timestamp.fromDate(new Date());
  await db.collection('complaints').add(json)
    .then(ref => {
      console.log('Added document with ID: ', ref.id);
      db.collection('users').doc(uid).update({
        complaints: admin.firestore.FieldValue.arrayUnion(ref.id)
      }).then(ref => {
        console.log('Added document with ID: ', ref.id);
      }).catch(err => {
        console.log('Error adding document: ', err);
      });
    }).catch(err => {
      console.log('Error adding document: ', err);
    });
}




function getAllComplaints(cid) {
  db.collection("complaints").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      return doc.data();
    });
  });
}

async function getComplaintTypes(ministry) {
  await db.collection("ministries").where("Name", "==", ministry).get().then((querySnapshot) => {
    var complaints_types = [];
    querySnapshot.forEach((doc) => {
      // console.log(doc.data());
      const data = doc.data().complaint_types;
      for (var i = 0; i < data.length; i++)
        complaints_types.push(data[i]);
    });
    console.log(complaints_types);
    return complaints_types;
  })
}

router.get('/GetFullComplaint', isLoggedIn, async (req, res) => {
  var jsonData = {}
  await db.collection("complaints").doc(req.query.cid).get().then((querySnapshot) => {
    jsonData = querySnapshot.data();
  });
  var cid = req.query.cid;
  var uid = jsonData.UID;
  var user_id = req.session.user.idToken.payload.sub;

  await db.collection('users').doc(user_id).update({
    notifications: admin.firestore.FieldValue.arrayRemove({ "cid": cid })
  }).then(ref => {
    console.log('Removed complaint id from notification: ', ref.id);
  }).catch(err => {
    console.log('Error removing complaint id from notification: ', err);
  });

  for (var i = 0; i < jsonData.comments.length; i++) {
    await db.collection("users").doc(jsonData.comments[i].uid).get().then((userdata) => {
      jsonData.comments[i]["uid"] = userdata.data().Name;
    })
  }
  res.render('user/complaintpage', {
    complaint: jsonData,
    cid: req.query.cid,
    UserData: req.session.user
  });

})

router.get('/GetFullComplaintAdmin1', userRole.isDesk1, async (req, res) => {
  var jsonData = {}
  await db.collection("complaints").doc(req.query.cid).get().then((querySnapshot) => {
    console.log(querySnapshot.id);
    jsonData = { ...querySnapshot.data(), id: querySnapshot.id };
  })
  var user = req.session.user;
  var enduser;
  for (var i = 0; i < jsonData.comments.length; i++) {
    await db.collection("users").doc(jsonData.comments[i].uid).get().then((userdata) => {
      jsonData.comments[i]["uid"] = userdata.data().Name;
    })
  }
  db.collection("users").doc(jsonData.UID).get().then((userData) => {
    enduser = userData.data();
    db.collection("ministries").where("Name", "==", jsonData.ministry).get().then((docs) => {
      docs.forEach((doc) => {
        escalate = doc.data().SubType
        res.render('desk1/complaintpage', {
          complaint: jsonData,
          cid: req.query.cid,
          UserData: user,
          EndUserData: enduser,
          Escalate: escalate
        });
      })
    })
  })
})

router.get('/GetFullComplaintAdmin2', userRole.isDesk2, async (req, res) => {
  var jsonData = {}
  await db.collection("complaints").doc(req.query.cid).get().then((querySnapshot) => {
    console.log(querySnapshot.id);
    jsonData = { ...querySnapshot.data(), id: querySnapshot.id };
  })
  var user = req.session.user;
  var enduser;
  for (var i = 0; i < jsonData.comments.length; i++) {
    await db.collection("users").doc(jsonData.comments[i].uid).get().then((userdata) => {
      jsonData.comments[i]["uid"] = userdata.data().Name;
    })
  }
  await db.collection("users").doc(jsonData.UID).get().then((userData) => {
    enduser = userData.data();
  })
  console.log(jsonData);
  res.render('desk2/complaintpage', {
    complaint: jsonData,
    cid: req.query.cid,
    UserData: user,
    EndUserData: enduser
  });
})

router.get('/UpdateSummary', (req, res) => {
  var complaint_id = req.query.cid;
  var summary = req.query.summary;
  db.collection('complaints').doc(complaint_id).update({
    ComplaintSummary: summary
  }).then(ref => {
    console.log('Updated complaint summary: ', ref.id);
  }).catch(err => {
    console.log('Error updating complaint summary: ', err);
  });
  var url = '/GetFullComplaintAdmin1' + "?cid=" + complaint_id;
  res.redirect(url);
});

router.get('/Dashboard', async (req, res) => {
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
  var userinfo;
  await db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });
  res.render('user/text_to_speech', {userData: userinfo});
})

router.get('/VideoGeneration', async (req,res) => {
  var userinfo;
  await db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });
  res.render('user/video_generation', { userData: userinfo });
})

router.get('/VideoTranslation', async (req,res) => {
  var userinfo;
  await db.collection("Users").doc(id).get().then((doc) => {
    console.log(doc.data());
    userinfo = doc.data();
  });
  res.render('user/video_translation', { userData: userinfo });
})

router.post('/VideoTranslation', upload.single('video_name'), async (req,res) => {
  console.log(req.file);
  const storageRef = storage.ref(req.file.originalname);
  await storageRef.put(req.file.buffer, {
    contentType: req.file.mimetype
  })
  const video_url = await storageRef.getDownloadURL()
  console.log(video_url);
})
/********************************************
 * Content Studio End
 ********************************************/

router.get('/OnboardAdmin', isLoggedIn, async (req, res) => {
  var ministries = [];
  await db.collection("ministries").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      console.log(doc.data());
      ministries.push(doc.data().Name);
    });
  })
  console.log(ministries);
  res.render('superadmin/onboard_admins', { ministries: ministries });
})

router.get('/Desk1Dashboard', userRole.isDesk1, async (req, res) => {
  const ministry = req.session.user.idToken.payload['custom:ministry'];
  const role = req.session.user.idToken.payload['custom:role']
  console.log(ministry);
  var complaints = [];
  await db.collection("complaints").where("ministry", "==", ministry).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      if(doc.data().current_desk==role && doc.data().status=="Pending")
        complaints.push({ ...doc.data(), id: doc.id });
    })
  })
  var userinfo = [];
  var approved = 0, pending = 0, rejected = 0;
  for (var i = 0; i < complaints.length; i++) {
    await db.collection("users").doc(complaints[i].UID).get().then((userData) => {
      userinfo.push(userData.data());
    })
    pending++;
  }
  console.log(complaints);
  var signedin_user_info = req.session.user;
  var userId = req.session.user.idToken.payload.sub;
  var complaints_resolved = [];
  await db.collection("users").doc(userId).get().then((doc) => {

    complaints_resolved = doc.data().complaints_resolved;

  })
  console.log(complaints_resolved);
  for (var i = 0; i < complaints_resolved.length; i++) {
    if (complaints_resolved[i].status == "Approved") {
      approved++;
    }
    else {
      rejected++;
    }
  }
  res.render('desk1/desk1dashboard', { signedin_user_info: signedin_user_info, userinfo: userinfo, complaints: complaints, approved: approved, rejected: rejected, pending: pending });
})

router.get('/Desk2Dashboard', userRole.isDesk2, async (req, res) => {
  const ministry = req.session.user.idToken.payload['custom:ministry'];
  var complaint_types = []
  await db.collection("ministries").where("Name", "==", ministry).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data().complaint_types;
      for (var i = 0; i < data.length; i++)
        complaint_types.push(data[i]);
    });
  })
  var complaints = [];
  var userinfo = [];
  for (var i = 0; i < complaint_types.length; i++) {
    await db.collection("complaints").where("type", "==", complaint_types[i]).where("current_desk", "==", 2).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        complaints.push({ ...doc.data(), id: doc.id });
      })
    })
  }
  var approved = 0, pending = 0, rejected = 0;
  for (var i = 0; i < complaints.length; i++) {
    await db.collection("users").doc(complaints[i].UID).get().then((userData) => {
      userinfo.push(userData.data());
    })
    pending++;
  }
  var signedin_user_info = req.session.user;
  var userId = req.session.user.idToken.payload.sub;
  var complaints_resolved = [];
  await db.collection("users").doc(userId).get().then((querySnapshot) => {
    complaints_resolved = querySnapshot.data().complaints_resolved;
  })
  for (var i = 0; i < complaints_resolved.length; i++) {
    if (complaints_resolved[i].status == "Approved") {
      approved++;
    }
    else {
      rejected++;
    }
  }
  res.render('desk2/desk2dashboard', { signedin_user_info: signedin_user_info, userinfo: userinfo, complaints: complaints, approved: approved, rejected: rejected, pending: pending });
})


router.post('/Escalate', userRole.isDesk1, async (req, res) => {

  var complaint_id = req.body.cid;
  console.log(req.body.type);
  escalteComplaintDesk1(complaint_id, req.body.type);
  var user_id = req.session.user.idToken.payload.sub;

  addComment(complaint_id, user_id, "Complaint escalated to " + req.body.type, req.session.user.idToken.payload["custom:role"]);
  db.collection('users').doc(user_id).update({
    complaints_resolved: admin.firestore.FieldValue.arrayUnion({
      cid: complaint_id,
      time: admin.firestore.Timestamp.fromDate(new Date()),
      status: "Escalated"
    })
  }).then(ref => {
    console.log('Added comaplaint id: ', ref.id);
    db.collection('complaints').doc(complaint_id).get().then((complaint) => {
      var end_user_id = complaint.data().UID;
      checkNsendSMS(end_user_id, "Your complaint has been escalated to " + req.body.type)
      db.collection('users').doc(end_user_id).update({
        notifications: admin.firestore.FieldValue.arrayUnion({
          cid: complaint_id
        })
      }).then(ref => {
        console.log('Added comaplaint id: ', ref.id);
      }).catch(err => {
        console.log('Error adding complaint id: ', err);
      });
      return res.redirect('/Desk1Dashboard');
    })
  }).catch(err => {
    console.log('Error adding complaint id: ', err);
  });
})


function checkNsendSMS(end_user_id, message) {
  console.log("in Messaging");
  console.log(end_user_id);
  console.log(message);

  db.collection('var').doc('mics').get().then((doc) => {
    console.log(doc.data().sms);
    console.log("in sent sms")
    if (doc.data().sms)
      db.collection('users').doc(end_user_id).get().then((user) => {
        console.log("SMS Sent");
        sms.sendsms(user.data().Phone, message);
      })
    else if (doc.data().email)
      db.collection('users').doc(end_user_id).get().then((user) => {
        console.log("Email Sent");
        sendemailto.SendEmail(user.data().Email, "[Important] Updates from Shikayat portal", message);
      })
  })
}


router.get('/approveComplaintDesk1/', userRole.isDesk1, async (req, res) => {
  var complaint_id = req.query.cid;
  approveComplaintDesk1(complaint_id);
  var user_id;
  var email = req.session.user.idToken.payload.email;
  console.log(email);
  await db.collection("users").where("Email", "==", email).get().then((userData) => {
    userData.forEach((doc) => {
      user_id = doc.id;
    })
  })

  addComment(complaint_id, user_id, "Your Complaint has been approved", req.session.user.idToken.payload["custom:role"]);

  await db.collection('users').doc(user_id).update({
    complaints_resolved: admin.firestore.FieldValue.arrayUnion({
      cid: complaint_id,
      time: admin.firestore.Timestamp.fromDate(new Date()),
      status: "Approved"
    })
  }).then(ref => {
    console.log('Added comaplaint id: ', ref.id);
  }).catch(err => {
    console.log('Error adding complaint id: ', err);

  });

  var end_user_id;
  await db.collection('complaints').doc(complaint_id).get().then((complaint) => {
    end_user_id = complaint.data().UID;
    checkNsendSMS(end_user_id, "Your Complaint has been approved at " + req.session.user.idToken.payload["custom:role"] + " level.")
  })

  await db.collection('users').doc(end_user_id).update({
    notifications: admin.firestore.FieldValue.arrayUnion({
      cid: complaint_id
    })
  }).then(ref => {
    console.log('Added comaplaint id: ', ref.id);
  }).catch(err => {
    console.log('Error adding complaint id: ', err);
  });

  return res.redirect('/Desk1Dashboard');
});

router.get('/approveComplaint', userRole.isDesk1, async (req, res) => {
  var complaint_id = req.query.cid;
  approveComplaintDesk2(complaint_id, req.session.user.idToken.payload["custom:role"]);
  var user_id = req.session.user.idToken.payload.sub;
  addComment(complaint_id, user_id, "Complaint has been processed and resolved.", req.session.user.idToken.payload["custom:role"]);
  console.log(complaint_id);
  console.log(user_id);
  await db.collection('users').doc(user_id).update({
    complaints_resolved: admin.firestore.FieldValue.arrayUnion({
      cid: complaint_id,
      time: admin.firestore.Timestamp.fromDate(new Date()),
      status: "Approved"
    })
  }).then(ref => {
    console.log('Added complaint id: ', ref.id);
  }).catch(err => {
    console.log('Error adding complaint id: ', err);
  });

  var end_user_id;
  await db.collection('complaints').doc(complaint_id).get().then((complaint) => {
    end_user_id = complaint.data().UID;
  })
  checkNsendSMS(end_user_id, "Your Complaint has been approved at " + req.session.user.idToken.payload["custom:role"] + " level.")
  await db.collection('users').doc(end_user_id).update({
    notifications: admin.firestore.FieldValue.arrayUnion({
      cid: complaint_id
    })
  }).then(ref => {
    console.log('Added complaint id: ', ref.id);
  }).catch(err => {
    console.log('Error adding complaint id: ', err);
  });
  return res.redirect('/Desk1Dashboard');
});

router.get('/rejectComplaint/', userRole.isStaff, async (req, res) => {
  var complaint_id = req.query.cid;
  rejectComplaint(complaint_id);
  var user_id = req.session.user.idToken.payload.sub;
  addComment(complaint_id, user_id, "Complaint has been rejected due to certain reasons.", req.session.user.idToken.payload["custom:role"]);

  await db.collection('users').doc(user_id).update({
    complaints_resolved: admin.firestore.FieldValue.arrayUnion({
      cid: complaint_id,
      time: admin.firestore.Timestamp.fromDate(new Date()),
      status: "Rejected"
    })
  }).then(ref => {
    console.log('Added complaint id: ', ref.id);
  }).catch(err => {
    console.log('Error adding complaint id: ', err);
  });

  var end_user_id;
  await db.collection('complaints').doc(complaint_id).get().then((complaint) => {
    end_user_id = complaint.data().UID;
  })
  checkNsendSMS(end_user_id, "Complaint has been rejected due to certain reasons at " + req.session.user.idToken.payload["custom:role"] + " level.")
  await db.collection('users').doc(end_user_id).update({
    notifications: admin.firestore.FieldValue.arrayUnion({
      cid: complaint_id
    })
  }).then(ref => {
    console.log('Added complaint id: ', ref.id);
  }).catch(err => {
    console.log('Error adding complaint id: ', err);
  });

  var role = req.session.user.idToken.payload['custom:role'];

  if (role == "desk1") {
    return res.redirect('/Desk1Dashboard');
  } else {
    return res.redirect('/Desk2Dashboard');
  }
})

function updateComplaint(cid, data) {
  db.collection("complaints").doc(cid).update(data);
}

function approveComplaintDesk1(cid) {
  db.collection("complaints").doc(cid).update({ current_desk: 2 });
}
function escalteComplaintDesk1(cid, office) {
  console.log("Cid" + cid)
  db.collection("complaints").doc(cid).update({ current_desk: office });
}
function approveComplaintDesk2(cid, office) {
  db.collection("complaints").doc(cid).update({ current_desk: office, status: "Approved" });
}

function rejectComplaint(cid) {
  db.collection("complaints").doc(cid).update({ status: "Rejected" });
}

async function addComment(cid, uid, comment, role = "user") {
  await db.collection('complaints').doc(cid).update({
    comments: admin.firestore.FieldValue.arrayUnion({
      uid: uid,
      time: admin.firestore.Timestamp.fromDate(new Date()),
      comment: comment
    })
  }).then(ref => {
    console.log('Added document with ID: ', ref.id);
  }).catch(err => {
    console.log('Error adding document: ', err);
  });
  console.log(role);
  if (role != "user") {
    var end_user_id;
    await db.collection('complaints').doc(cid).get().then((complaint) => {
      end_user_id = complaint.data().UID;
    })
    await db.collection('users').doc(end_user_id).update({
      notifications: admin.firestore.FieldValue.arrayUnion({
        cid: cid
      })
    }).then(ref => {
      console.log('Added comaplaint id: ', ref.id);
    }).catch(err => {
      console.log('Error adding complaint id: ', err);
    });
  }
}

function updateUser(uid, userData) {
  db.collection('Users').doc(uid).update({
    ...userData
  }).then(ref => {
    console.log('Added document with ID: ', ref.id);
  }).catch(err => {
    console.log('Error adding document: ', err);
  });
}

//get comments
function getComments(cid) {
  db.collection('complaints').doc(cid).get().then((querySnapshot) => {
    console.log(querySnapshot.data().comments);
  }).catch(err => {
    console.log('Error getting document', err);
  });
}
// getComments('34e0a738-9426-4efb-b721-bb7502fe96c01660976645775')

router.get('/ComplaintRegistration', userRole.isUser, async (req, res) => {
  var subType = []
  await db.collection("ministries").where("Name", "==", req.query.ministry).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      subType = doc.data().complaint_types;
    })
  }).catch(err => {
    console.log('Error getting document', err);
  });
  console.log(subType);
  res.render('user/complaintRegistration', { ministry: req.query.ministry, userData: req.session.user, subType: subType });
})

router.post('/LodgeComplaint', userRole.isUser, async (req, res) => {
  console.log("Lodge Complaint");
  var complaint_summary = "";
  if (req.body.ComplaintBody == "") {
    complaint_body = "We celebrate Independence Day as the national festival of India. The Day marks\nthe anniversary of national independence from the British Empire on 15th august\n1947. Furthermore, it is the most auspicious day for the people of India because\nIndia becomes independent after lots of hardships and sacrifices of the brave\nIndian freedom fighters. The entire nation celebrates this day with the full spirit of\n\npatriotism.\n"
  }
  const runRequestBody = {
    text: req.body.ComplaintBody
  };

  var user_id = req.session.user.idToken.payload.sub;
  var complaint_ids = []
  await db.collection("users").doc(user_id).get().then((result) => {
    complaint_ids = result.data().complaints;
  })

  var complaint_summaries = []
  for (var i = 0; i < complaint_ids.length; i++) {
    await db.collection("complaints").doc(complaint_ids[i]).get().then((result) => {
      console.log(result);
      complaint_summaries.push(result.data().ComplaintBody);
    })
  }
  request.post({
    // url: "http://13.233.148.244:8000/text-summarizer/",
    url: "http://127.0.0.1:8000/text-summarizer/",
    json: runRequestBody
  },
    async function (error, response, body) {
      console.log("Error", error);
      JSON.stringify(body);
      console.log("Body", body);
      complaint_summary = body.extracted_text;

      console.log(req.body.ComplaintBody);
      console.log(complaint_summaries);
      const similarityRequestBody = {
        document1: req.body.ComplaintBody,
        documents: complaint_summaries
      }

      request.post({
        url: "http://127.0.0.1:8000/document_similarity/",
        json: similarityRequestBody
      },
        async function (error, response, body) {
          console.log("Error", error);
          JSON.stringify(body);
          console.log("Body", body);
          var similarity = body.percentage;
          complaintData = {
            ComplaintBody: req.body.ComplaintBody,
            UID: req.session.user.idToken.payload.sub,
            Employer: req.body.Employer,
            type: req.body.type,
            comments: [],
            ComplaintSummary: complaint_summary,
            // additional_file: req.files.additional_file.name,
            current_desk: "Desk 1",
            status: "Pending",
            ministry: req.body.ministry,
            percentage: similarity
          }

          var complaint_id ;
          complaintData["Time"] = admin.firestore.Timestamp.fromDate(new Date());
          await db.collection('complaints').add(complaintData)
            .then(ref => {
              console.log('Added document with ID: ', ref.id);
              complaint_id = ref.id;
            }).catch(err => {
              console.log('Error adding document: ', err);
            });

          await db.collection('users').doc(req.session.user.idToken.payload.sub).update({
            complaints: admin.firestore.FieldValue.arrayUnion(complaint_id)
          }).then(ref => {
            console.log('Added document with ID: ', ref.id);
          }).catch(err => {
            console.log('Error adding document: ', err);
          });

          if(req.files)
          {
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
          }

          try {
                var buf= req.body.websnap;
                var buffer1 = Buffer.from(buf, 'base64');
                console.log(buffer1);
                console.log(buf);
                upload.UploadCamera(buffer1,complaint_id);
              } catch (error) {
              }

          if(similarity >= 70){
            rejectComplaint(complaint_id);
            var user_id = "1fa7a076-fd83-4f47-8073-326cf059e454";
            addComment(complaint_id, user_id, "Complaint has been rejected as similar complaint was registered earlier.", "Desk 1");
            await db.collection('users').doc(user_id).update({
              complaints_resolved: admin.firestore.FieldValue.arrayUnion({
                cid: complaint_id,
                time: admin.firestore.Timestamp.fromDate(new Date()),
                status: "Rejected"
              })
            }).then(ref => {
              console.log('Added complaint id: ', ref.id);
            }).catch(err => {
              console.log('Error adding complaint id: ', err);
            });

            var end_user_id=req.session.user.idToken.payload.sub;
            checkNsendSMS(end_user_id, "Complaint has been rejected as similar complaint was registered earlier.")
            await db.collection('users').doc(end_user_id).update({
              notifications: admin.firestore.FieldValue.arrayUnion({
                cid: complaint_id
              })
            }).then(ref => {
              console.log('Added complaint id: ', ref.id);
            }).catch(err => {
              console.log('Error adding complaint id: ', err);
            });

            var role = req.session.user.idToken.payload['custom:role'];
          }
          res.redirect('/Dashboard');
        });
    });
})


router.get('/getObject', (req, res) => {

  // get the current user complaint details
  var user = req.session.user;

  let s3 = new AWS.S3();
  async function getImage() {
    const data = s3.getObject(
      {
        Bucket: 'complaint-bucket-sih',
        Key: "mpv-shot0004.jpg"
      }

    ).promise();
    return data;
  }


  getImage()
    .then((img) => {

      res.send(image)
    }).catch((e) => {
      res.send(e)
    })

  function encode(data) {
    let buf = Buffer.from(data);
    let base64 = buf.toString('base64');
    return base64
  }

})


async function LoginwithPhone(phone) {
  await db.collection('users').where('Phone', '==', phone).get().then(docs => {
    if (docs.empty) {
      return "";
    }
    else {
      docs.forEach(doc => {
        console.log(doc.data().Email)
        return doc.data().Email;
      })
    }
  })

}


module.exports = {
  router: router,
  insertItem: insertItem,
  checkFirstTimeLogin: checkFirstTimeLogin,
  insertComplaint: insertComplaint,
  getAllComplaints: getAllComplaints,
  addComment: addComment,
  updateComplaint: updateComplaint,
  approveComplaintDesk1: approveComplaintDesk1,
  approveComplaintDesk2: approveComplaintDesk2,
  rejectComplaint: rejectComplaint,
  updateUser: updateUser,
  LoginwithPhone: LoginwithPhone,
  checkUserPresent: checkUserPresent,
  id: id
};
