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

    $("#botTypeInput > .btn").click(function(){
        $(this).addClass("active").siblings().removeClass("active");
    });
}

function onChatInit(botType, botToken){
    // notify the server about the bot selected
    selectBot(botType, botToken);

    // catch 'messagesList' event sent from the server
    this.socket.on('conversationsList', (conversations) => {
        renderConversations(conversations);
    });
    
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
function onCreateBotBtnPressed(){
    let botToken = $('#botTokenInput').val();
    let botType = $('#botTypeInput > .btn.active').val();
    let botAlias = $('#botAliasInput').val();
    if(botToken && botType && botAlias){
        let newBot = createNewBotObject(botToken, botType, botAlias);
        addBot(this.socket, newBot);
        
        navToChatScreen();
        onChatInit(botType, botToken);

        //reset inputs
        $('#botTokenInput').val('');
        $('#botAliasInput').val('');
        $("#botTypeInput > .btn").removeClass("active").siblings().removeClass("active");
    }
    else {
        $('#new-bot-form').addClass('was-validated')
    }
};

// handler for table row 'click' event
function onBotsTableRowSelected(evt){
    let row = $(evt.target);
    // Check if the target retrieved is one of the inner controls. If so, getParent until we reach the <tr>
    while(!row.hasClass('botTableRow')){
        row = row.parent()
    }
    let rowCells = row.children('td');
    let selectedBotType = rowCells[1].innerText;
    let selectedBotToken = rowCells[2].innerText;

    navToChatScreen();
    onChatInit(selectedBotType, selectedBotToken);    
};

// handler for conversation 'click' event
function onConversationSelected(evt){
    debugger;
    let selectedListItem = $(evt.target);
    // Check if the target retrieved is one of the inner controls. If so, getParent until we reach the <a>
    while(!selectedListItem.hasClass('conversation-list-item')){
        selectedListItem = selectedListItem.parent();
    }
    let conversationId = selectedListItem.attr('data-conversationId');
    getConversationMessages(conversationId);
}

/*******************
 * Data Management *
 *******************/

// Creates a new bot object following as described by the Message Model
// It receives the alias and token input controls
function createNewBotObject(botToken, botType, botAlias){
    let newBot = {
        createdOn: new Date(),
        token: botToken,
        type: botType,
        alias: botAlias,
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

// Emits a new bot event, sending the new bot data to the backend
function addBot(socket, newBot){
    socket.emit('addBot', newBot);
}

// Emit botSelected event with the corresponding token
function selectBot(botType, botToken){
    socket.emit('botSelected', {
        botType: botType, 
        botToken: botToken
    })
}

// Emit a get messages event for a given Bot token
function getConversationMessages(conversaionId){
    socket.emit('getMessages', conversaionId);
}

// Emits a new message event, sending the new message data to the backend
function addMessage(socket, newMessage){
    socket.emit('addMessage', newMessage);
}

// Emits a new message event, sending the new message data to the backend
function sendCleanUp(socket){
    socket.emit('cleanUp');
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
        html += '<tr class="botTableRow"><td>' + bots[i].alias + '</td><td>' + bots[i].type + '</td><td>' + bots[i].token + '</td><td>' + bots[i].createdOn + '</td></tr>';
    }
    botsTableBody.html(html);

    $('.botTableRow').on('click', (evt) => {
        onBotsTableRowSelected(evt);
    });
};

/**
 * 
 */
function renderConversations(conversations){
    let conversationsList = $('#conversationsList');
    let html = '';
    for(let i=0; i<conversations.length; i++){
        html += '<a href="#" data-conversationId="' + conversations[i].conversationId + '" class="list-group-item list-group-item-action flex-column align-items-start mb-2 conversation-list-item">';
        html += '<div class="d-flex w-100 justify-content-between">';
        html += '<h5 class="mb-1">' + conversations[i].conversationId + '</h5>';
        html += '</div>';
        html += '<p class="mb-1">' + conversations[i].createdOn + '</p>'
        html += '</a>'
    }
    conversationsList.html(html);

    $('.conversation-list-item').on('click', (evt) => {
        onConversationSelected(evt)
    });
};

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
            html += '<pre>' + messages[i].messageContent + '</pre><footer class="blockquote-footer">' + messages[i].timestamp + '</footer></blockquote></div></div>';
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

    sendCleanUp(this.socket);
};