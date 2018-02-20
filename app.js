// Require modules
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const recastai = require('recastai').default;

// Require models
let Message = require('./models/message');
let Bot = require('./models/bot');


/*******************
 * Mongoose Config *
 *******************/
// Initialize mongoose
mongoose.connect('mongodb://localhost/chat');
let db = mongoose.connection;

// Check DB connection
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Check for DB errors
db.on('error', (error) => {
    console.log(err);
});


/********************
 * Recast.AI Config *
 ********************/
function setRecastBot(botToken){
    //let recastClient = new recastai('7342ac85a271995d596f6d21acfa0b88');
    let recastClient = new recastai(botToken);
    //let recastConnect = recastClient.connect;
    //let recastBuild = recastClient.build;

    return recastClient;
};


/******************
 * Express Config *
 ******************/
// Initialize express
const app = express();

// set view engine
app.set('view engine', 'pug');
// set views path
app.set('views', path.join(__dirname, 'views'));
// set the static folder as the static directory for the express app
app.use(express.static(path.join(__dirname,'static')));

// Body-Parser Middleware
// ----------------------
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())


/*******************
 * Express Routing *
 *******************/
app.get('/', (req, res) => {
    res.render('layout', {
        title: 'Chat App'
    });
});


/****************
 * Start server *
 ****************/
// Create a server and pass it to socketIo.io
var server = http.createServer(app);
var io = socketIo.listen(server);

// Start server
app.set('port', process.env.PORT || 3000);
server.listen(app.get('port'));
console.log('Server: started and listening port ' + app.get('port'));


/********************
 * Socket.io events *
 ********************/
// store active connections
let connections = [];

// on new connection
io.sockets.on('connection', (socket) => {
    let recastBot;
    let conversationId = 0;
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);

    // if this socket gets disconnected
    socket.on('disconnect', (data) => {
        connections.splice(connections.indexOf(socket), 1)
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    // catch 'getBots' event
    socket.on('getBots', () => {
        sendBotsToClient();
    });

    // catch 'botSelected' event
    socket.on('botSelected', (botToken) => {
        recastBot = setRecastBot(botToken);
        sendMessagesToClient();
    });
    
    // catch 'getMessages' event
    socket.on('getMessages', () => {
        sendMessagesToClient();
    });

    // catch 'addBot' event sent from client
    socket.on('addBot', (data) => {
        let newBot = new Bot();
        newBot.createdOn = data.createdOn;
        newBot.alias = data.alias;
        newBot.token = data.token;

        addNewBot(newBot);        
    });

    // catch 'addMessage' event sent from client
    socket.on('addMessage', (data) => {
        let newMessage = new Message();
        newMessage.timestamp = data.timestamp;
        newMessage.author = data.author;
        newMessage.type = data.type;
        newMessage.messageContent = data.messageContent;

        let d = new Date();
        conversationId = d.getTime();
        recastBot.build.dialog({type: 'text', content: newMessage.messageContent}, { conversationId: conversationId.toString() })
        .then(res => {
            for(let i = 0; i < res.messages.length; i++ ){
                let newBotMessage = new Message();
                newBotMessage.timestamp = new Date();
                newBotMessage.author = 'Bot';
                newBotMessage.type = res.messages[i].type;
                newBotMessage.messageContent = res.messages[i].content;

                addNewMessages(newBotMessage);
            }
        })
        .catch(err => console.error('Error stablishing bot conversation', err));

        addNewMessages(newMessage);
    });

    /*****************
     * DB Management *
     *****************/

    // update messages in all sockets
    function addNewBot(newBot){
        newBot.save((err) => {
            if(err){
                console.log(err);
            }
            else {
                sendBotsToClient();
            }
        });        
    };

    // update messages in all sockets
    function addNewMessages(newMessage){
        newMessage.save((err) => {
            if(err){
                console.log(err);
            }
            else {
                sendMessagesToClient();
            }
        });        
    };

    // Get list of bots from DB and send them to the client
    function sendBotsToClient(){
        Bot.find({}, (err, allBots) => {
            if(err){
                console.log(err);
            }
            else {
                io.sockets.emit('botsList', allBots);
            }
        });
    };

    // Get list of messages from DB and send them to the client
    function sendMessagesToClient(){
        Message.find({}, (err, allMessages) => {
            if(err){
                console.log(err);
            }
            else {
                io.sockets.emit('messagesList', allMessages);
            }
        });
    };
});