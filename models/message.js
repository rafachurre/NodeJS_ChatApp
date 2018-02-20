// Require modules
let mongoose = require('mongoose');

let messageSchema = mongoose.Schema({
    timestamp: {
        type: Date,
        required: true
    },
    conversationId: {
        type: Number,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    messageContent: {
        type: String,
        required: true
    }
});

let Message = module.exports = mongoose.model('Message', messageSchema);