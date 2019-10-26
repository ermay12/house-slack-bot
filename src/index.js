const config = require("../config.json");

const express = require("express");
const request = require("request");
const fs = require("fs");
const app = express();
app.use(express.json());

app.listen(config.port, () =>
  console.log(`Server running on port ${config.port}`)
);

app.post("/", function(req, res) {
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
  try {
    res.send(req.body.challenge);
  } catch (error) {
    res.send("Failure: " + error);
  }
});
