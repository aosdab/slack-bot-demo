const mongoose = require('mongoose');
const express = require('express');

// require dotenv to protect login credentials for the database
require('dotenv').config({path: 'private.env'});

// call the private .env file for the route to the database used on line 23
const ROUTE = process.env.ROUTE;

// Using routes instead of passing in app as a function, prevented some errors
const router = module.exports = express.Router();

// Use ES6 Promises to silence deprecation warning
mongoose.Promise = global.Promise;

// Load commands
const handleQueries = require('./commands');

// local testing
//     mongoose.connect('mongodb://localhost:27017/todo-bot');

// deployment
mongoose.connect(ROUTE);

mongoose.connection.once('open', () => {
  console.log('Connected to DB.');
})
.on('error', function(err) {
  console.log('Connection error:', err);
});

// Handle GET requests
router.get('/', function(req, res) {
  handleQueries(req.query, res);
});

// Handle POST requests
router.post('/', function(req, res) {
  handleQueries(req.body, res);
});