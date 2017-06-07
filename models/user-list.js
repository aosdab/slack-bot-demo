const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create todo schema
const TodoSchema = new Schema({
  number: {type: Number, default: 0},
  listItem: String,
  timestampCreated: {type: Date, default: Date.now()},
  completed: {type: Boolean, default: false},
  timestampCompleted: Date
});

// Create user schema
const UserSchema = new Schema({
  id: String,
  list: [TodoSchema]
});

// Create user model (which will house each person's list)
const User = mongoose.model('user', UserSchema);

module.exports = User;