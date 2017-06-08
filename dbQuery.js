/**
 * Created by Vampiire on 6/7/17.
 */

// Load helper functions
const helpers = require('./helpers');

// Load schema
const User = require('./models/user-list');

let data;

// Look for user in list:
function dbQuery(ID, command, text = null){

    User.findOne({id: ID}).then(function(result) {

        const user = helpers.user(ID, result);

        switch (command) {
            case 'add':
                let length = user.list.length;
                user.list.push({number: length, listItem: text});
                user.save(function(err) {
                    if (err) throw err;
                    console.log('New item added to an existing todo list document array');
                });
                break;

            case 'complete':
                text = Number(text);
                // Some error checking
                if (isNaN(text)) {
                    console.log('Is it NaN?:', isNaN(text));
                    data = {text: 'Error: Use the todo\'s `#` instead of typing it out!'};
                }
                // Assuming the user passes in the 'id' number of the user
                user.list[text].completed = true;
                user.list[text].timestampCompleted = Date.now();

                user.save(function(err) {
                    if (err) throw err;
                    console.log(`Item at index: ${text} has been marked as complete.`);
                });
                break;

            case 'delete':
                text = Number(text);
                // Some error checking
                if (isNaN(text)) {
                    data = {text: 'Error: Use the todo\'s `#` instead of typing it out!'};
                }
                user.list.splice(text, 1);
                user.save(function(err) {
                    if (err) console.log(err);
                    console.log(`List item ${text} has been deleted.`);
                });

                // Iterate over list to update IDs of remaining items:
                user.list.forEach((e, i) => {
                    user.list[i].number = i;
                    user.save(function(err) {
                        if (err) console.log(err);
                        console.log('List item numbers have been updated.');
                    })
                });
                break;

            case 'help':
                data = {
                    text: 'Hi there! The list of commands available are:\n`add <message>` - Adds a todo to the list\n`complete <#>`'
                };
                break;

            default:
                data = {text: 'Invalid command! Type `/todo help` for more info.'};
        }

        data = {
            response_type: 'ephemeral',
            attachments: [
                {
                    title: "Todo List",
                    text: (user.list.length ? helpers.view(user.list) : 'Your todo list is empty! :smiley: \nAdd something by typing `/todo add <message>`'),
                    mrkdwn_in: ['text'],
                    callback_id: 'command',
                    actions: [
                        {
                            name: 'action',
                            text: 'COMPLETE AN ITEM',
                            type: 'select',
                            value: 'complete',
                            style: 'primary',
                            options: helpers.display(user.list)
                        },
                        {
                            name: 'action',
                            text: 'DELETE AN ITEM',
                            type: 'select',
                            value: 'delete',
                            style: 'danger',
                            options: helpers.display(user.list),
                            confirm: {
                                title: 'Are you SURE?',
                                text: 'Think about it',
                                ok_text: 'Yes',
                                dismiss_text: 'No'
                            }
                        }]
                }
            ]
        };

    });

    return data;
}

module.exports = dbQuery;
