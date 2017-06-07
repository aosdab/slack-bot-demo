const mongoose = require('mongoose');
// Load schema
const User = require('./models/user-list');

function createUser(user_id, result) {
  // If user not found, create new user
  if (result === null) {
    const newUser = new User({
      id: user_id
    });
    newUser.save();
    console.log('Added a new slack user todo list document into collection');
    return newUser;
  }
  else {
    console.log(`User ${result.id} found.`);
    return result;
  }
}

function view(list) {

  let outputString = "```";
  list.forEach((e) => {
    if (e.completed) {
      outputString += `${e.number} [X] ${e.listItem}\t\t<!date^${Date.parse(e.timestampCompleted)/1000}^(completed: {date_pretty} at {time}|failed to load>)\n`;
    }
    else {
      outputString += `${e.number} [ ] ${e.listItem}\t\t<!date^${Date.parse(e.timestampCreated)/1000}^(created: {date_pretty} @ {time}|failed to load>)\n`;
    }
  })
  return outputString + "```";
}

module.exports = {
  user: createUser,
  view: view
};