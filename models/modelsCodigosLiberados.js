const mongoose = require('mongoose');
const CodigoLiberadoSchema = new mongoose.Schema({
    codigo: { type: String, unique: true, required: true },
    tipo: { type: String, required: true } // Tipo de código: "usuarios", "entrenar", "entrenamientos", etc.
});

module.exports = mongoose.model('codigosliberados', CodigoLiberadoSchema);