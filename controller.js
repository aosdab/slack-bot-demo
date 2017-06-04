const mongoose = require('mongoose');
const express = require('express');

// Using routes instead of passing in app as a function, prevented some errors
const router = module.exports = express.Router()

// Load schema
const User = require('./models/user-list');

// Use ES6 Promises to silence deprecation warning
mongoose.Promise = global.Promise;

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

function handleQueries(req, res) {
  
  // Validate slack app token
  if (req.token !== 'nPJ9nsPaIBb9dv2MDtDRY7sL') {
    console.error('Invalid Token');
    return res.json({text: 'Error: Invalid Token'});
  }

  if (req.text) {
    // Extract information from text
    let text = req.text,
        user_id = req.user_id,
        command,
        listText;
        // Store list items to be outputted to slack
        // outputString = '';

    // `~` bitwise-operater equivalent to '!== -1'
    // It essentially does -(n + 1), so if n = -1, answer is 0 which is false
    if (~text.indexOf(' ')) {

      // Get command and list text
      command = req.text.substring(0, text.indexOf(' '));
      listText = req.text.substring(text.indexOf(' ') + 1);
    }
    else {
      command = text;
    }

    // Look for user in list:
    User.findOne({id: user_id}).then(function(user) {

      // If user not found, create new user
      if (user === null) {
        const newUser = new User({
          id: user_id
        })
        newUser.save();
        console.log('Added a new slack user todo list document into collection');
      }
      else {
        console.log(`User ${user.id} found.`);
        switch (command) {

          case 'add': 
            let length = user.list.length;
            user.list.push({number: length + 1, listItem: listText});
            user.save(function(err) {
              if (err) throw err;
              console.log('New item added to an existing todo list document array');
            });

            // if (user.list.length === 0) {
            //   outputString = 'The list is empty! Try the [add] command to populate it!';
            // }
            break;

          case 'complete':
            user.list.forEach((e) => {
              // Assuming the user passes in the 'id' number of the 
              if (e.number == listText) {
                e.completed = true;
                e.timestampCompleted = Date.now();

                user.save(function(err) {
                  if (err) throw err;
                  console.log(`Item at index: ${listText} has been marked as complete.`);
                })
              }
            })
            break;

          case 'delete':
            user.list.splice(Number(listText), 1);
            user.save(function(err) {
              if (err) console.log(err);
              console.log(`List item ${listText} has been deleted.`);
            })

            // Iterate over list again to update IDs of remaining items:
            user.list.forEach((e, i) => {
              user.list[i].number = i;
              user.save(function(err) {
                if (err) console.log(err);
                console.log('List item numbers have been updated.');
              })
            })

            // outputString = `List item ${listText} has been deleted.`;
            break;
        }
      }

      function view(list) {
        let outputString = "```";
        list.forEach((e) => {
          if (e.completed) {
            outputString += `\n${e.number} [X] ${e.listItem}\t<!date^${Date.parse(e.timestampCompleted)/1000}^(completed: {date_pretty} at {time}|failed to load>)\t\n`;
          }
          else {
            outputString += `\n${e.number} [ ] ${e.listItem}\t<!date^${Date.parse(e.timestampCreated)/1000}^(created: {date_pretty} @ {time}|failed to load>)\t\n`;
          }
        })
        return outputString + "```";
      }

      let data = {
        response_type: 'ephemeral',
        attachments: [
          {
            title: "Todo List",
            text: view(user.list),
            mrkdwn_in: ['text']
          }
        ]
      };
      res.json(data);
    })
  }
}