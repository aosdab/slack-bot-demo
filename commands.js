// Load schema
const User = require('./models/user-list');
// Load helper functions
const helpers = require('./helpers');

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

      const user = helpers.user(user_id, result);

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
          listText = Number(listText);
          // Some error checking
          if (isNaN(listText)) {
            console.log('Is it NaN?:', isNaN(listText));
            return res.json({text: 'Error: Use the todo\'s `#` instead of typing it out!'});
          }
          // Assuming the user passes in the 'id' number of the user
          user.list[listText].completed = true;
          user.list[listText].timestampCompleted = Date.now();

          user.save(function(err) {
            if (err) throw err;
            console.log(`Item at index: ${listText} has been marked as complete.`);
          })
          break;

        case 'delete':
          listText = Number(listText);
          // Some error checking
          if (isNaN(listText)) {
            return res.json({text: 'Error: Use the todo\'s `#` instead of typing it out!'});
          }
          user.list.splice(listText, 1);
          user.save(function(err) {
            if (err) console.log(err);
            console.log(`List item ${listText} has been deleted.`);
          })

          // Iterate over list to update IDs of remaining items:
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
          return res.json({
            text: 'Hi there! The list of commands available are:\n`add <message>` - Adds a todo to the list\n`complete <#>` - Marks a todo as completed\n`delete <#>` - Deletes a todo from the list\n`view` - Shows your current todo list'
          })

        default: 
          return res.json({text: 'Invalid command! Type `/todo help` for more info.'});
      }

      let data = {
        response_type: 'ephemeral',
        attachments: [
          {
            title: "Todo List",
            text: (user.list.length ? helpers.view(user.list) : 'Your todo list is empty! :smiley: \nAdd something by typing `/todo add <message>`'),
            mrkdwn_in: ['text']
          }
        ]
      };
      res.json(data);
    },
    function rejected(err) {
      console.log('Promise rejection error:', err);
    })
  }
}

module.exports = handleQueries;