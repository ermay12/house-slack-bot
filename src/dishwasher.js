const config = require("../config.json");

const fs = require("fs");
const { sendMessage } = require("./slackAPI.js");
const { getUsers, addPoints } = require("./users.js");

const WASH_TIME = 10 /*S*/ * 1000; /*ms per S*/
const REMIND_TIME = 10 /*S*/ * 1000; /*ms per S*/

var dishwasherJobs = require("../persistedData/dishwasherJobs");
function saveDishwasherJobs() {
  fs.writeFileSync(
    "./persistedData/dishwasherJobs.json",
    JSON.stringify(dishwasherJobs)
  );
}

function onBoot() {
  dishwasherJobs.forEach(dishwasherJob => {
    dishwasherJob.events.forEach(event => {
      if (event.isCancelled) {
        return;
      }
      let f;
      switch (event.callback) {
        case REMIND_FUNCTION:
          f = remind;
          break;
        case DONE_WASHING_FUNCTION:
          f = doneWashing;
          break;
        default:
          throw new Error("invalid callback function");
      }
      setTimeout(f, event.time - Date.now(), dishwasherJob, event);
    });
  });
}

const REMIND_FUNCTION = "REMIND_FUNCTION";
function remind(dishwasherJob, event) {
  if (event.isCancelled) {
    return;
  }
  sendMessage(`<@${event.userID}>, ahem?`, dishwasherJob.thread);

  dishwasherJob.events = dishwasherJob.events.filter(e => e !== event);
  newEvent = {
    time: Date.now() + REMIND_TIME,
    callback: REMIND_FUNCTION,
    isCancelled: false,
    userID: event.userID
  };
  dishwasherJob.events.push(newEvent);
  setTimeout(remind, REMIND_TIME, dishwasherJob, newEvent);
  saveDishwasherJobs();
}

const DONE_WASHING_FUNCTION = "DONE_WASHING_FUNCTION";
async function doneWashing(dishwasherJob, event) {
  if (event.isCancelled) {
    return;
  }
  let userID = dishwasherJob.userOrder[0];
  dishwasherJob.thread = await sendMessage(
    `Dishwasher is done running! <@${userID}>, can you unload it please?`
  );

  dishwasherJob.events = dishwasherJob.events.filter(e => e !== event);
  newEvent = {
    time: Date.now() + REMIND_TIME,
    callback: REMIND_FUNCTION,
    isCancelled: false,
    userID
  };
  dishwasherJob.events.push(newEvent);
  setTimeout(remind, REMIND_TIME, dishwasherJob, newEvent);
  saveDishwasherJobs();
}

exports.dishwasherStart = function(req, res) {
  addPoints(req.body.user_id, 1);
  newDishwasherJob = {
    events: [
      {
        time: Date.now() + WASH_TIME,
        callback: DONE_WASHING_FUNCTION,
        isCancelled: false
      }
    ],
    userOrder: getUsers()
      .sort((a, b) => a.score - b.score)
      .map(user => user.id),
    currentUserIndex: 0
  };
  dishwasherJobs.push(newDishwasherJob);
  setTimeout(
    doneWashing,
    WASH_TIME,
    newDishwasherJob,
    newDishwasherJob.events[0]
  );
  saveDishwasherJobs();
  res.send({
    text: `Thank you <@${req.body.user_id}>`,
    response_type: "in_channel"
  });
};

exports.dishwasherMessage = function(req, res) {
  if (req.body.event.thread_ts) {
    for (let i = 0; i < dishwasherJobs.length; i++) {
      let dishwasherJob = dishwasherJobs[i];
      if (
        dishwasherJob.thread === req.body.event.thread_ts &&
        req.body.event.type === "app_mention"
      ) {
        let userID = req.body.event.user;
        if (req.body.event.text.toLowerCase().includes("defer")) {
          dishwasherJob.events.forEach(event => {
            event.isCancelled = true;
          });
          nextUserIndex =
            (dishwasherJob.currentUserIndex + 1) %
            dishwasherJob.userOrder.length;
          dishwasherJob.currentUserIndex = nextUserIndex;
          nextUserID = dishwasherJob.userOrder[nextUserIndex];
          newEvent = {
            time: Date.now() + REMIND_TIME,
            callback: REMIND_FUNCTION,
            isCancelled: false,
            userID: nextUserID
          };
          dishwasherJob.events.push(newEvent);
          setTimeout(remind, REMIND_TIME, dishwasherJob, newEvent);
          saveDishwasherJobs();
          sendMessage(
            `That's cool. <@${nextUserID}> can you do it?`,
            dishwasherJob.thread
          );
        } else if (req.body.event.text.toLowerCase().includes("done")) {
          dishwasherJob.events.forEach(event => {
            event.isCancelled = true;
          });
          addPoints(userID, 1);
          dishwasherJobs = dishwasherJobs.filter(d => d !== dishwasherJob);
          saveDishwasherJobs();
          sendMessage("Thank you! +1 points for you :)", dishwasherJob.thread);
          sendMessage(
            `<!channel>, Dishwasher is now empty thanks to <@${userID}>. Please wash any dishes you left in the sink now.`
          );
        } else {
          sendMessage(
            `Sorry I don't understand what you are telling me.  Either say "defer" or "done".`,
            dishwasherJob.thread
          );
        }
        res.send("success");
        return true;
      }
    }
  }
  return false;
};

onBoot();
