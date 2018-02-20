// Require modules
let mongoose = require('mongoose');

let conversationSchema = mongoose.Schema({
    createdOn: {
        type: Date,
        required: true
    },
    conversationId: {
        type: Number,
        required: true
    },
    botToken: {
        type: String,
        required: true
    }
});

let Conversation = module.exports = mongoose.model('Conversation', conversationSchema);