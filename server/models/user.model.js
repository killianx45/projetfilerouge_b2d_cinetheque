const mongoose = require('mongoose');

const User = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true},
    likes: { type: Array, required: false},
    watch: { type: Array, required: false},
    watchlist: { type: Array, required: false},
}, 
{ collection: 'users-data' });

const model = mongoose.model('UserData', User);

module.exports = model;