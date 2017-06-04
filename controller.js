const mongoose = require('mongoose');
const express = require('express');

// Using routes instead of passing in app as a function, prevented some errors
const router = module.exports = express.Router()

// Use ES6 Promises to silence deprecation warning
mongoose.Promise = global.Promise;

// Load commands
const handleQueries = require('./commands')

mongoose.connect('mongodb://localhost:27017/todo-bot')
mongoose.connection.once('open', () => {
  console.log('Connected to DB.');
})
.on('error', function(err) {
  console.log('Connection error:', err);
});

// Handle GET requests
router.get('/', function(req, res) {
  handleQueries(req.query, res);
})

// Handle POST requests
router.post('/', function(req, res) {
  handleQueries(req.body, res);
})