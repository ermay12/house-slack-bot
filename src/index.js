const config = require("../config.json");

const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const { dishwasherStart, dishwasherMessage } = require("./dishwasher.js");

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
    if (dishwasherMessage(req, res)) {
      return;
    }
    res.send("Nothing to do with message");
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
    switch (req.body.command) {
      case "/dishwasher-started":
        console.log("/dishwasher-started");
        dishwasherStart(req, res);
        break;
      default:
        throw new Error("Unsupported slash command");
    }
  } catch (error) {
    res.send("Failure: " + error);
  }
});
