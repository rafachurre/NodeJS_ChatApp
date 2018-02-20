// Script startup
$(document).ready(function(){
    onInit();
})

// Executed when running the app
// Gets the list of the bots and render it in the welcome screen
function onInit(){
    this.socket = io.connect();

    // ask for the list of messages
    getListOfBots();

    // catch 'botsList' event sent from the server
    this.socket.on('botsList', (bots) => {
        renderBotsTableRows(bots);
    });

    navToWelcomeScreen();

    // Prevent form submition
    $('#new-bot-form').on('submit', (evt) => {
        evt.preventDefault();
    })
    
    //New bot created
    $('#createBotBtn').on('click', (evt) => {
        onCreateBotBtnPressed();
    });
}

function onChatInit(botToken){
    // ask for the list of messages
    selectBot(botToken);

    // catch 'messagesList' event sent from the server
    this.socket.on('messagesList', (messages) => {
        renderMessages(messages);
    });

    //New message sent
    $('.chat-new-input').on('change', (evt) => {
        $target = $(evt.target);
        let newMessage = createNewMessageObject($target);
        addMessage(this.socket, newMessage);
        //reset input
        $target.val('');
    });

    // Back button click event
    $('#backButton').on('click', (evt) => {
        clenupChatScreen();
        navToWelcomeScreen();
    });
}

/******************
 * Event Handlers *
 ******************/
// handler for Create Bot 'click' event
function onCreateBotBtnPressed(evt){
    let token = $('#botTokenInput').val();
    let alias = $('#botAliasInput').val();
    if(token && alias){
        let newBot = createNewBotObject(token, alias);
        addBot(this.socket, newBot);
        
        navToChatScreen();
        onChatInit(token);

        //reset inputs
        $('#botTokenInput').val();
        $('#botAliasInput').val();
    }
    else {
        $('#new-bot-form').addClass('was-validated')
    }
}

// handler for table row 'click' event
function onBotsTableRowSelected(evt){
    we are here !!!
}

/*******************
 * Data Management *
 *******************/

// Creates a new bot object following as described by the Message Model
// It receives the alias and token input controls
function createNewBotObject(tokenInput, aliasInput){
    let newBot = {
        createdOn: new Date(),
        alias: aliasInput,
        token: tokenInput
    }
    return newBot;
}

// Creates a new message object following as described by the Message Model
// It receives the input control with the message text
function createNewMessageObject(inputControl){
    let newMessage = {
        timestamp: new Date(),
        author: 'Human',
        type: 'text',
        messageContent: inputControl.val()
    }
    return newMessage;
}

/************************
 * Server Communication *
 * **********************/
// Emit a get bots event to get the list of existing bots
function getListOfBots(){
   this.socket.emit('getBots');
}

// Emit botSelected event with the corresponding token
function selectBot(botToken){
    socket.emit('botSelected', botToken)
}

// Emit a get messages event for a given Bot token
function getBotMessages(){
    socket.emit('getMessages');
}

// Emits a new bot event, sending the new bot data to the backend
function addBot(socket, newBot){
    socket.emit('addBot', newBot);
}

// Emits a new message event, sending the new message data to the backend
function addMessage(socket, newMessage){
    socket.emit('addMessage', newMessage);
}


/**************
 * Navigation *
 * ************/
function navToWelcomeScreen(){
    $('#chatScreen').hide();
    $('#welcomeScreen').show();
}


function navToChatScreen(){
    $('#welcomeScreen').hide();
    $('#chatScreen').show();
}


/*******************
 * Rendering Logic *
 * *****************/

/**
 * Render available bots in the welcome screen table
 */
function renderBotsTableRows(bots){
    let botsTableBody = $('#bots-table-body');
    let html = '';
    for(let i=0; i<bots.length; i++){
        html += '<tr class="botTableRow"><td>' + bots[i].alias + '</td><td>' + bots[i].token + '</td><td>' + bots[i].createdOn + '</td></tr>';
    }
    botsTableBody.html(html);

    $('.botTableRow').on('click', (evt) => {
        onBotsTableRowSelected(evt);
    });
}

/**
 * Render conversation messages in the chat screen
 */
function renderMessages(messages){
    let chatArea = $('#chatArea');
    let html = '';
    for(let i=0; i<messages.length; i++){
        html += '<div class="card mb-3">';

        // Set message header grey if human, blue if bot
        if(messages[i].author === 'Human'){
            html += '<h5 class="card-header">' + messages[i].author + '</h5>';
        }
        else if(messages[i].author === 'Bot'){
            html += '<h5 class="card-header bg-info text-white">' + messages[i].author + '</h5>';
        }

        // Set message content
        html += '<div class="card-body"><blockquote class="blockquote mb-0">';

        if(messages[i].type === 'text'){
            html += '<p>' + messages[i].messageContent + '</p><footer class="blockquote-footer">' + messages[i].timestamp + '</footer></blockquote></div></div>';
        }
        else if(messages[i].type === 'picture'){
            html += '<img src="' + messages[i].messageContent + '" class="img-thumbnail"><footer class="blockquote-footer">' + messages[i].timestamp + '</footer></blockquote></div></div>';
        }
    }

    chatArea.html(html);

    //Scroll to the bottom
    setTimeout(function(){
        window.scrollTo(0,document.body.scrollHeight);
    }, 300);
};

/**
 * cleanup chat screen
 */
function clenupChatScreen(){
    let chatArea = $('#chatArea');
    let messageInput = $('.chat-new-input');

    messageInput.val();
    chatArea.empty();
};