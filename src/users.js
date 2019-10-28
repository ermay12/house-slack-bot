const fs = require("fs");

const { sendMessage, getUsers } = require("./slackAPI.js");

var users = require("../persistedData/users.json");

function saveUsers() {
  fs.writeFileSync("./persistedData/users.json", JSON.stringify(users));
}

exports.getUsers = function() {
  return users;
};

exports.addPoints = function(userID, points) {
  user = users.find(v => v.id === userID);
  if (user) {
    user.score += points;
    saveUsers();
  }
};

exports.refreshUsers = async function() {
  allUsers = await getUsers().map(userId => ({ id: userId, score: 0 }));
  allUsers.forEach(user => {
    existingUser = users.find(v => v.id === user.id);
    if (existingUser) {
      user.score = existingUser.score;
    }
  });
  users = allUsers;
  saveUsers();
};

exports.updateScore = function(req, res) {
  let outputString = "";
  users.forEach(user => {
    outputString += `<@${user.id}>: ${user.score},\n`;
  });
  res.send({
    text: outputString,
    response_type: "in_channel"
  });
};

exports.refreshUsers();
