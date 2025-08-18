const {request} = require("express");
require('dotenv').config();

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFI_TOKEN;
let getHomePage = (req,res) => {
    return res.send('Hello World!');

}
let getWebhook = (req,res) => {

    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    // Check if a token and mode is in the query string of the request
    if (mode && token) {
        // Check the mode and token sent is correct
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            // Respond with the challenge token from the request
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            // Respond with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
}
let postWebhook = (req,res) => {
    let body = req.body;

    console.log(`\u{1F7EA} Received webhook:`);
    console.dir(body, { depth: null });
    if (body.object === "page") {
        // Returns a '200 OK' response to all requests
        res.status(200).send("EVENT_RECEIVED");
        // Determine which webhooks were triggered and get sender PSIDs and locale, message content and more.
        body.entry.forEach(entry => {
            //gets the body of the webhook event
            let webhook_event= entry.messaging[0];
            console.log(webhook_event);

            //get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID:'+ sender_psid);

            if(webhook_event.message){
                handleMessage(sender_psid, webhook_event.message);
            }
            else if(webhook_event.postback){
                handlePostback(sender_psid, webhook_event.postback);
            }
        })
    } else {
        res.sendStatus(404);
    }
}
// Handles messages events
function handleMessage(sender_psid, received_message) {
    let response;
    if(received_message.text){
        console.log("Received message:", received_message.text);
        response={
            "text": `You sent the message "${received_message.text}". Now send me an image!`
        }
    }
    callSendAPI(sender_psid,response);
}

//Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

//Sends response messages via the send API
function callSendAPI(sender_psid, response) {
    let request_body = {
        "recipient":{
            "id":sender_psid
        },
        "message": response
    }

    request({
        "uri": "https://graph.facebook.com/v21.0/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}


module.exports = {
    getHomePage: getHomePage,
    getWebhook: getWebhook,
    postWebhook: postWebhook
}