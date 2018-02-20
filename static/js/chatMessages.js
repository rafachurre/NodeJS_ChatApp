$(document).ready(function(){
    var socket = io.connect();
    
    // ask for the list of messages
    socket.emit('getMessages');

    // catch 'messagesList' event sent from the server
    socket.on('messagesList', (messages) => {
        renderMessages(messages);
    });

    //New message sent
    $('.chat-new-input').on('change', (evt) => {
        $target = $(evt.target);
        let newMessage = createNewMessageObject($target);
        addMessage(socket, newMessage);
        //reset input
        $target.val('');
    });
})

function createNewMessageObject(inputControl){
    let newMessage = {
        timestamp: new Date(),
        author: 'Human',
        type: 'text',
        messageContent: inputControl.val()
    }
    return newMessage;
}

function addMessage(socket, newMessage){
    socket.emit("addMessage", newMessage);
}

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
    
}