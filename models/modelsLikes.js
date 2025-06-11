const mongoose = require('mongoose');
const LikesSchema = new mongoose.Schema({
    entrenamiento: { 
        type: String, 
        required: true 
    },
    usuario: { 
        type: String, 
        required: true 
    }
});

module.exports = mongoose.model('likes', LikesSchema);