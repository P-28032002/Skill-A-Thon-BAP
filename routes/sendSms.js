require('dotenv').config();
const client = require('twilio')(process.env.TwilioAccountSid, process.env.TwilioAuthToken);

function sendsms(to,message) {
    client.messages
        .create({ body: message, from: process.env.TwilioPhoneNumber, to: to })
        .then(message => console.log(message.sid)).catch(err => console.log(err));
    console.log("sms sent");

}

module.exports = {sendsms};