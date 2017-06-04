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
    User.findOne({id: user_id}).then(function(result) {

      const user = createUser(result);

      switch (command) {
        case 'add': 
          let length = user.list.length;
          user.list.push({number: length, listItem: listText});
          user.save(function(err) {
            if (err) throw err;
            console.log('New item added to an existing todo list document array');
          });
          break;

        case 'complete':
          // Some error checking
          if (!Number(listText)) {
            res.json({text: 'Error: Use the todo\'s `#` instead of typing it out!'});
            break;
          }
          user.list.forEach((e) => {
            // Assuming the user passes in the 'id' number of the user
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
          break;
        
        case 'view':
          // Go straight to view
          break;

        case 'help':
          res.json({
            text: 'Hi there! The list of commands available are:\n`add <message>` - Adds a todo to the list\n`complete <#>` - Marks a todo as completed\n`delete <#>` - Deletes a todo from the list\n`view` - Shows your current todo list'
          })
          break;

        default: 
          res.json({text: 'Invalid command! Type `/todo help` for more info.'});
          break;
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

function createUser(result) {
  // If user not found, create new user
  if (result === null) {
    const newUser = new User({
      id: user_id
    })
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