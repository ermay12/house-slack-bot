const config = require("../config.json");
const request = require("request-promise");

exports.getUsers = function() {
  console.log("getting users");
  return request({
    method: "GET",
    uri: config.slackAPI.channelInfo,
    headers: { Authorization: `Bearer ${config.bearerToken}` },
    qs: { channel: config.channel },
    json: true
  }).then(body => {
    return body.channel.members.filter(member => member !== config.botID);
  });
};

exports.sendMessage = function(message, thread_ts) {
  console.log("sending message");
  data = { text: message, channel: config.channel };
  if (thread_ts) {
    data.thread_ts = thread_ts;
  }
  return request({
    method: "POST",
    uri: config.slackAPI.postMessage,
    headers: { Authorization: `Bearer ${config.bearerToken}` },
    body: data,
    json: true
  }).then(body => body.ts);
};
