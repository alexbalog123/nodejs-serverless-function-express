const mongoose = require("mongoose");
const EventosSchema = new mongoose.Schema({
    _id: { type: String },
    nombre: { 
        required: true, 
        type: String
    },
    descripcion: {
        type: String
    },
    tipo: {
        required: true,
        type: String
    }
}, {__v: false});

const CodigoLiberado = require('./modelsCodigosLiberados');

EventosSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await CodigoLiberado.create({ codigo: this._id, tipo: 'eventos' });
    next();
});

EventosSchema.pre('save', async function (next) {
    const eventos = this;
    if (!eventos.isNew) return next();

    try {
        let nuevoID = "EV00001";  // Código inicial si no hay liberados

        // Buscar código liberado del tipo 'eventos'
        const codigoLiberado = await CodigoLiberado.findOne({ tipo: 'eventos' }).sort({ codigo: 1 }).exec();
        
        if (codigoLiberado) {
            nuevoID = codigoLiberado.codigo;
            await CodigoLiberado.deleteOne({ codigo: nuevoID, tipo: 'eventos' }); // Eliminarlo de la lista de liberados
        } else {
            // Si no hay códigos liberados, generar uno nuevo
            const ultimoEvento = await this.constructor.findOne({}).sort({ _id: -1 }).exec();
            if (ultimoEvento && ultimoEvento._id) {
                const match = ultimoEvento._id.match(/^EV(\d{5})$/);
                if (match) {
                    const ultimoNumero = parseInt(match[1], 10);
                    const nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
                    nuevoID = `EV${nuevoNumero}`;
                }
            }
        }

        eventos._id = nuevoID;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("eventos", EventosSchema);