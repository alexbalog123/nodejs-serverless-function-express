const mongoose = require('mongoose');
const GuardadosSchema = new mongoose.Schema({
    entrenamiento: { 
        type: String, 
        required: true 
    },
    usuario: { 
        type: String, 
        required: true 
    }
});

module.exports = mongoose.model('guardados', GuardadosSchema);