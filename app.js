'use strict';
// Declare modules
const express = require('express');
const bodyParser = require('body-parser');
const controller = require('./controller');

// Instantiate express and allow it to be 'required'
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Using routes here
app.use('/', controller);

// Start server
const port = process.env.PORT || 3000;

app.listen(port, function(){
    console.log(`Express server listening on port ${port}...`);
});