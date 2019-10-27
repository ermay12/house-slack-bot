const config = require("../config.json");

const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const fs = require("fs");
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(config.port, () =>
  console.log(`Server running on port ${config.port}`)
);

function logRequest(req) {
  console.log("new post");
  fs.appendFile(
    `./logs/posts.txt`,
    new Date(Date.now()).toString() +
      "\n\n" +
      JSON.stringify(req.headers) +
      "\n\n" +
      JSON.stringify(req.url) +
      "\n\n" +
      JSON.stringify(req.params) +
      "\n\n" +
      JSON.stringify(req.body) +
      "\n-------------------------------------\n\n",
    err => {
      if (err) throw err;
      console.log("Post saved!");
    }
  );
}

function verifyRequest(req) {
  return req.body.token === config.token;
}

function sendMessage(message) {
  console.log("sending message");
  request(
    {
      method: "POST",
      uri: config.webhook,
      body: { text: message },
      json: true
    },
    function(error, response, body) {
      if (error) {
        return console.error("Failed to send message:", error);
      }
      console.log("message sent.");
    }
  );
}

function processCommand(req, res) {
  sendMessage("hi did someone call me?");
  res.send("success!");
}

function processNewMessage(req) {}

app.post("/", function(req, res) {
  logRequest(req);
  try {
    if (!verifyRequest(req)) {
      console.log("invalid request");
      res.send("Failure: invalid token");
      return;
    }
    if (res.body.type === "url_verification") {
      res.send(req.body.challenge);
      return;
    }
    processNewMessage(req, res);
  } catch (error) {
    res.send("Failure: " + error);
  }
});

app.post("/command", function(req, res) {
  logRequest(req);
  try {
    if (!verifyRequest(req)) {
      console.log("invalid request");
      res.send("Failure: invalid token");
      return;
    }
    processCommand(req, res);
  } catch (error) {
    res.send("Failure: " + error);
  }
});
