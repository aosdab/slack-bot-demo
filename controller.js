/**
 * Created by Vampiire on 6/1/17.

 PLAN:

 1) check if a document exists for the given ID (user or channel) - if document exists proceed to 2)

 1a) if document does not yet exist create it for that given user or channel ID

 2)
 add: add a [list item] to that document's list array
 complete: find item based on its id [item.id] and edit item.completed to True and add a timestamp
 view: iterate through the documents in the collection and display each
 delete: find the item based on its id [item.id] and splice it out of the list array

 3) after each add / delete / done is complete callback view

 */

// require mongoose to enable interaction with mLab database
const mongoose = require('mongoose');

// connect mongoose to mLab database
mongoose.connect('mongodb://chingu-todo:todoBOT@ds161121.mlab.com:61121/todo-bot');

// create a schema for the items in the list array (format for each todo item)

let itemsSchema = new mongoose.Schema({
    _id: {type: Number, default: 0},
    listItem: String,
    timestampCreated: {type: Date, default: Date.now()},
    completed: {type: Boolean, default: false},
    timestampCompleted: Date
});

// create a schema for each document in the collection. each document (containing the todo list array)
// is unique to the slack user who calls it. their slack id replaces the default _id passed by mongoDB
let listSchema = new mongoose.Schema({
    _id: String,
    list: [itemsSchema]
});

// create model that implements the list Schema

let list = mongoose.model('list', listSchema);

module.exports = function(app) {

// Handle GET requests
    app.get('/', function (req, res) {
        handleQueries(req.query, res);
    });

// Handle POST requests
    app.post('/', function (req, res) {
        handleQueries(req.body, res);
    });

    function handleQueries(req, res) {

        // Validate slack app token
        if (req.token !== "nPJ9nsPaIBb9dv2MDtDRY7sL") {
            console.error("Invalid Token");
            return res.json({text: "Error: Invalid Token"});
        }
        if (req.text) {
        // pull the request sent from slack to the bot. extract the text, and slack user ID
        // the text will contain both the command (followed by a space) and the string associated with the command
        // (after the space) as seen by the substrings
            let text = req.text,
                user_id = req.user_id,
                command,
                listText;

        // create a variable to store the list items as a string to pass to the response back to slack
            let outputString = '';

        // a bug was presented when a user selected the "view" command because it is not followed by a space
        // the condition below corrects for this issue
            if(text.indexOf(' ') !== -1){
               command = req.text.substring(0, text.indexOf(' '));
               listText = req.text.substring(text.indexOf(' ')+1);
            }
            else{
                command = text;
            }



    // search for the slack user's list based on their slack ID
            list.find({_id: user_id}, function(err, doc){

                switch(command){
                    case 'add':

                            // if the user already has a list then push the "added" item into that list and save to the database
                            // doc is always returned as an array. to determine if the list exists check the length, if
                            // it is empty then it does not exist and move to the else statement
                            if(doc.length > 0){

                            // the length of the array is passed as the ID. although arrays are 0 indexed because the item
                            // is assigned its ID before being pushed it will provide the expected value
                                let length = doc[0].list.length;

                            // this was tricky. doc is returned as an array with the object as an element within it. use [0]
                            // to define the first element in the array (the object we want to work with)
                                doc[0].list.push({_id: length, listItem : listText});

                                doc[0].save(function(err){
                                    if(err) throw err;
                                    console.log('new item added to an existing todo list document array');
                                });
                            }

                            // if the user does not already have a list in the collection then create one and pass their slack ID
                            // as well as their list item as the first element in the list array
                            else{

                                list.create({
                                    _id: user_id,
                                    list: [
                                        { _id: 0, listItem : listText }
                                    ]
                                }, function(err){
                                    if(err) throw err;
                                    console.log('added a new slack user todo list document into the collection');

                                });
                            }
                        outputString = 'New list item added succesfully!';
                        break;

                    case 'view':
                    // iterates through the list and populates a string to be passed back to the user by the bot's response (res)
                        function view(){
                            doc[0].list.forEach(function(e){

                                if(e.completed){
                                    outputString += `\n${e._id} [X] <!date^${Date.parse(e.timestampCompleted)/1000}^(completed: {date_pretty} at {time}|failed to load>)\t${e.listItem}\n`;
                                }
                                else{
                                    outputString += `\n${e._id} [  ] <!date^${Date.parse(e.timestampCreated)/1000}^(created: {date_pretty} @ {time}|failed to load>)\t${e.listItem}\n`;
                                }

                            });
                        }
                    // if the list is empty notify the user, otherwise call view and populate the outputString
                        if(doc[0].list.length === 0){
                            outputString = 'The list is empty! Try the [add] command to populate it';
                        }
                        else{
                            view();
                        }

                        break;

                    case 'complete':
                    // iterates through the list array and marks the user's selection as complete
                        doc[0].list.forEach(function(e){
                        // tests loose equality because the id is a number but the text passed by the user is a string

                            if(e._id == listText){

                        // marks the item as completed and adds a timestamp for the completion, saves to the database
                                e.completed = true;
                                e.timestampCompleted = Date.now();

                                doc[0].save(function(err){
                                    if(err) throw err;
                                    console.log(`item at index ${listText} has been marked as complete`);
                                });
                            }
                        });

                        outputString = `List item ${listText} has been marked as complete`;
                        break;

                    case 'delete':
                    // iterates through the list and splices out the desired list item, saves to the database
                        doc[0].list.forEach(function(e, i){
                           if(e._id == listText){
                              doc[0].list.splice(i, 1);
                              doc[0].save(function(err){
                                  if(err) throw err;
                                  console.log(`List item ${listText} has been deleted`);

                              });
                           }

                        });

                    // after a deletion takes place iterate back through the array and update the IDs
                    // of the remaining items
                        doc[0].list.forEach(function(e,i){

                            doc[0].list[i]._id = i;

                            doc[0].save(function(err){
                                if(err) throw err;

                                console.log(`list item ids have been updated`);

                            });

                        });

                        outputString = `List item ${listText} has been deleted!`;
                        break;
                }

                if(err) throw err;

            // dynamic responses based on the command that was issued (each has a unique outputString)
                let data = {
                    response_type: 'ephemeral',
                    attachments: [
                        {
                            title: "Todo List",
                            text: outputString
                        }
                    ]
                };

                res.json(data);

            });
        }
    }
};


