const config = require("../config.json");

const express = require("express");
const request = require("request");
const app = express();
app.use(express.json());

app.listen(config.port, () =>
  console.log(`Server running on port ${config.port}`)
);

app.post("/", function(req, res) {
  try {
    res.send(req.body.challenge);
  } catch (error) {
    res.send("Failure: " + error);
  }
});
