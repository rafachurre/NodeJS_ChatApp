// Require modules
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const recastai = require('recastai').default;
const {Wit, log} = require('node-wit');

// Require models
let Message = require('./models/message');
let Bot = require('./models/bot');
let Conversation = require('./models/conversation');


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

/********************
 * Wit.AI Config *
 ********************/
function setWitaiBot(botToken){
    let witaiClient = new Wit({
        accessToken: botToken,
        logger: new log.Logger(log.DEBUG) // optional
      });

    return witaiClient;
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
    let botToken;
    let botType;
    let recastBot;
    let witaiBot;
    let conversationId;

    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);

    // if this socket gets disconnected
    socket.on('disconnect', (data) => {
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    socket.on('cleanUp', () => {
        botToken = undefined;
        recastBot = undefined;
        conversationId = undefined;
    });

    /* Bots Collection *
     *******************/
    // catch 'getBots' event
    socket.on('getBots', () => {
        sendBotsToClient();
    });

    // catch 'botSelected' event
    socket.on('botSelected', (data) => {
        botToken = data.botToken;
        botType = data.botType;
        if(botType === "recastai"){
            recastBot = setRecastBot(botToken);
            sendConversationsToClient(botToken);
            sendMessagesToClient(conversationId);
        }
        else if(botType === "witai"){
            witaiBot = setWitaiBot(botToken);
            sendConversationsToClient(botToken);
            sendMessagesToClient(conversationId);
        }
    });

    // catch 'addBot' event sent from client
    socket.on('addBot', (data) => {
        let newBot = new Bot();
        newBot.createdOn = data.createdOn;
        newBot.alias = data.alias;
        newBot.type = data.type;
        newBot.token = data.token;
        
        botToken = newBot.token;
        botType = newBot.type;
        let existingBot = checkIfBotExists(newBot, (newBot) => {
            // Add new bot to DB only if there is not other bot with this token
            addNewBot(newBot);
        });
        
    });

    /* Conversations Collection *
     ****************************/
    // catch 'getConversations' event
    socket.on('getConversations', () => {
        sendConversationsToClient(botToken);
    });

    // catch 'conversationSelected' event
    socket.on('conversationSelected', (conversationId) => {
        conversationId = conversationId;
        sendMessagesToClient(conversationId);
    });

    /* Messages Collection *
     ***********************/    
    // catch 'getMessages' event
    socket.on('getMessages', (conversationId) => {
        sendMessagesToClient(conversationId);
    });

    // catch 'addMessage' event sent from client
    socket.on('addMessage', (data) => {
        // If there is no conversation selected, create a new one
        if(!conversationId){
            conversationId = generateConversationId();
            let newConversation = new Conversation();
            newConversation.createdOn = new Date();
            newConversation.conversationId = conversationId;
            newConversation.botToken = botToken;

            addNewConversation(newConversation);
        };

        let newMessage = new Message();
        newMessage.timestamp = data.timestamp;
        newMessage.author = data.author;
        newMessage.type = data.type;
        newMessage.messageContent = data.messageContent;
        newMessage.conversationId = conversationId;


        if(botType === 'witai' && witaiBot){
            witaiBot.message(newMessage.messageContent).then((res) => {
                console.log('WitaiBot Response');
                console.log(JSON.stringify(res, undefined, 2));

                let newBotMessage = new Message();
                newBotMessage.timestamp = new Date();
                newBotMessage.author = 'Bot';
                newBotMessage.type = 'text';
                newBotMessage.messageContent = JSON.stringify(res, undefined, 2);
                newBotMessage.conversationId = conversationId;
                
                addNewMessages(newBotMessage);
            });
            addNewMessages(newMessage);
        }

        else if(botType === 'recastai' && recastBot){
            // Bot intent analysis
            recastBot.request.analyseText(newMessage.messageContent).then((res) => {
                console.log('response:');
                console.log(res);
                console.log('intent:');
                console.log(res.intent());
                console.log('entities:');
                console.log(res.entities);

                let newBotMessage = new Message();
                newBotMessage.timestamp = new Date();
                newBotMessage.author = 'Bot';
                newBotMessage.type = 'text';
                newBotMessage.messageContent = JSON.stringify(res, undefined, 2);
                newBotMessage.conversationId = conversationId;
                
                addNewMessages(newBotMessage);
            });
            addNewMessages(newMessage);

            /*
            // Bot dialog -> autogenerated responses
            recastBot.build.dialog({type: 'text', content: newMessage.messageContent}, { conversationId: conversationId.toString() })
            .then(res => {
                for(let i = 0; i < res.messages.length; i++ ){
                    let newBotMessage = new Message();
                    newBotMessage.timestamp = new Date();
                    newBotMessage.author = 'Bot';
                    newBotMessage.type = res.messages[i].type;
                    newBotMessage.messageContent = res.messages[i].content;
                    newBotMessage.conversationId = conversationId;

                    addNewMessages(newBotMessage);
                }
            })
            .catch(err => console.error('Error stablishing bot conversation', err));

            addNewMessages(newMessage);
            */
        }
    });

    /*****************
     * DB Management *
     *****************/

    /* Bots Collection *
     *******************/
    // update messages in all sockets
    function checkIfBotExists(newBot, callback){
        Bot.find({token: newBot.botToken}, (err, bots) => {
            if(err){
                console.log(err);
            }
            else {
                if(bots && bots.length > 1){
                    console.log('Bad data!! More than one bot with the same ID in the DB');
                }
                else if(bots && bots.length === 0){
                    callback(newBot);
                }
            }
        });   
    };
    
    // update messages in all socket
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

    /* Conversations Collection *
     ****************************/
    // Add new conversation ID to DB and notify the socket
    function addNewConversation(newConversation){
        newConversation.save((err) => {
            if(err){
                console.log(err);
            }
            else {
                sendConversationsToClient(newConversation.botToken);
            }
        });        
            
        
    };

    function sendConversationsToClient(botToken){
        Conversation.find({botToken: botToken}, (err, conversations) => {
            if(err){
                console.log(err);
            }
            else {
                console.log(conversations)
                io.sockets.emit('conversationsList', conversations);
            }
        });
    };
    

    /* Messages Collection *
     ***********************/
    // update messages in all sockets
    function addNewMessages(newMessage){
        newMessage.save((err) => {
            if(err){
                console.log(err);
            }
            else {
                sendMessagesToClient(newMessage.conversationId);
            }
        });        
    };

    // Get list of messages from DB and send them to the client
    function sendMessagesToClient(conversationId){
        Message.find({conversationId: conversationId}, (err, messages) => {
            if(err){
                console.log(err);
            }
            else {
                io.sockets.emit('messagesList', messages);
            }
        });
    };
});

/*********
 * Utils *
 *********/

function generateConversationId(){
    let d = new Date();
    return d.getTime();
}