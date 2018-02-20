// Require modules
let mongoose = require('mongoose');

let botSchema = mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    alias: {
        type: String,
        required: true
    },
    createdOn: {
        type: Date,
        required: true
    }
});

let Bot = module.exports = mongoose.model('Bot', botSchema);