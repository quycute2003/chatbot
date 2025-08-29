import axios from "axios";
require("dotenv").config();

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFI_TOKEN;

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
                console.log("Sender PSID:", sender_psid);

                if (webhook_event.message) {
                    handleMessage(sender_psid, webhook_event.message);
                } else if (webhook_event.postback) {
                    handlePostback(sender_psid, webhook_event.postback);
                }
            });
        });
    } else {
        res.sendStatus(404);
    }
};

async function handleMessage(sender_psid, received_message) {
    if (received_message.text) {
        console.log("Received message:", received_message.text);

        try {
            // Gửi tin nhắn sang API chatbot của bạn
            const apiRes = await axios.post(
                "https://chatbot-qcgh.onrender.com/chat/send",
                {
                    user_input: received_message.text,
                    sender: sender_psid, // có thể truyền thêm để phân biệt user
                }
            );

            // Giả sử API trả về { reply: "..." }
            const botReply = apiRes.data.reply || "Xin lỗi, tôi không hiểu.";

            const response = {
                text: botReply,
            };

            await callSendAPI(sender_psid, response);
        } catch (err) {
            console.error("Error calling chatbot API:", err.response?.data || err.message);

            const response = {
                text: "⚠️ Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu.",
            };
            await callSendAPI(sender_psid, response);
        }
    }
}

function handlePostback(sender_psid, received_postback) {
    // xử lý postback nếu có
}

async function callSendAPI(sender_psid, response) {
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
