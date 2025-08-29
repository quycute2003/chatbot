import axios from "axios";
require("dotenv").config();

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFI_TOKEN;
const CHAT_URL = "https://chatbot-qcgh.onrender.com/chat/send";

let getHomePage = (req, res) => {
    return res.send("Hello World!");
};

let getWebhook = (req, res) => {
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    if (mode && token) {
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
};

let postWebhook = async (req, res) => {
    let body = req.body;

    console.log(`\u{1F7EA} Received webhook:`);
    console.dir(body, { depth: null });

    if (body.object === "page") {
        res.status(200).send("EVENT_RECEIVED");

        body.entry.forEach(entry => {
            entry.messaging.forEach(webhook_event => {
                let sender_psid = webhook_event.sender.id;
                let page_id = entry.id;
                console.log(`Sender: ${sender_psid} | Page: ${page_id}`);

                if (webhook_event.message) {
                    handleMessage(sender_psid, webhook_event.message, page_id);
                } else if (webhook_event.postback) {
                    handlePostback(sender_psid, webhook_event.postback, page_id);
                }
            });
        });
    } else {
        res.sendStatus(404);
    }
};

async function handleMessage(sender_psid, received_message, page_id) {
    if (received_message.text) {
        console.log("Received message:", received_message.text);

        try {
            // gọi API chatbot với format mới
            const apiRes = await axios.post(CHAT_URL, {
                user_input: received_message.text,
            });

            // áp dụng cấu trúc data như React code
            const botReply =
                apiRes.data?.data?.bot_reply || "❌ Không có phản hồi từ server";

            const response = {
                text: botReply,
            };

            await callSendAPI(sender_psid, response, page_id);
        } catch (err) {
            console.error(
                "Error calling chatbot API:",
                err.response?.data || err.message
            );

            const response = {
                text: "❌ Lỗi kết nối server",
            };
            await callSendAPI(sender_psid, response, page_id);
        }
    }
}

function handlePostback(sender_psid, received_postback, page_id) {
    // xử lý postback nếu cần
}

async function callSendAPI(sender_psid, response, page_id) {
    const request_body = {
        recipient: { id: sender_psid },
        message: response,
    };

    try {
        const res = await axios.post(
            `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
            request_body
        );
        console.log("Message sent!", res.data);
    } catch (err) {
        console.error("Unable to send message:", err.response?.data || err.message);
    }
}

module.exports = {
    getHomePage,
    getWebhook,
    postWebhook,
};
