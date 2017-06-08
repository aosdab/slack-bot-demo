/**
 * Created by Vampiire on 6/7/17.
 */

// mongoose
    require('mongoose');

// Load helper functions
const helpers = require('./helpers');

// Load schema
const User = require('./models/user-list');

// Look for user in list:
function dbQuery(ID, command, text = null){

    return User.findOne({id: ID}).then(function(result) {

        const user = helpers.user(ID, result);

        switch (command) {
            case 'add':
                let length = user.list.length;
                user.list.push({number: length, listItem: text});
                user.save(function(err) {
                    if (err) throw err;
                });
                break;

            case 'complete':
                text = Number(text);

                // Assuming the user passes in the 'id' number of the user
                user.list[text].completed = true;
                user.list[text].timestampCompleted = Date.now();

                user.save(function(err) {
                    if (err) throw err;
                });
                break;

            case 'view':
                break;

            case 'delete':
                text = Number(text);

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
                    })
                });
                break;

            case 'help':
                return {
                    text: 'Hi there! The list of commands available are:\n`add <message>` - Adds a todo to the list\n`view` - Shows your todo list'
                };
                break;

            default:
                return {text: 'Invalid command! Type `/todo help` for more info.'};
        }

       return {
            response_type: 'ephemeral',
            attachments: [
                {
                    title: "Todo List",
                    text: (user.list.length ? helpers.view(user.list) : 'Your todo list is empty! :cry: \nAdd something by typing `/todo add <message>`'),
                    mrkdwn_in: ['text'],
                    callback_id: 'command',
                    actions: [
                        {
                            name: 'complete',
                            text: 'COMPLETE AN ITEM',
                            type: 'select',
                            value: 'complete',
                            style: 'primary',
                            options: helpers.display(user.list)
                        },
                        {
                            name: 'delete',
                            text: 'DELETE AN ITEM',
                            type: 'select',
                            value: 'delete',
                            style: 'danger',
                            options: helpers.display(user.list)
                        }]
                }
            ]
        };

    });

}
module.exports = dbQuery;
