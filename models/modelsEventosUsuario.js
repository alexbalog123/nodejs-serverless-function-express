const mongoose = require("mongoose");
const EventosUsuarioSchema = new mongoose.Schema({
    _id: { type: String },
    evento: { 
        required: true, 
        type: String
    },
    usuario: {
        type: String
    },
    fecha: {
        required: true,
        type: Date
    },
    hora: {
        required: true,
        type: String
    },
    notas: {
        type: String
    }
}, {__v: false});

const CodigoLiberado = require('./modelsCodigosLiberados');

EventosUsuarioSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await CodigoLiberado.create({ codigo: this._id, tipo: 'eventosusuario' });
    next();
});

EventosUsuarioSchema.pre('save', async function (next) {
    const eventosusuario = this;
    if (!eventosusuario.isNew) return next();

    try {
        let nuevoID = "EVU00001";  // Código inicial si no hay liberados

        // Buscar código liberado del tipo 'eventosusuario'
        const codigoLiberado = await CodigoLiberado.findOne({ tipo: 'eventosusuario' }).sort({ codigo: 1 }).exec();
        
        if (codigoLiberado) {
            nuevoID = codigoLiberado.codigo;
            await CodigoLiberado.deleteOne({ codigo: nuevoID, tipo: 'eventosusuario' }); // Eliminarlo de la lista de liberados
        } else {
            // Si no hay códigos liberados, generar uno nuevo
            const ultimoEventoUsuario = await this.constructor.findOne({}).sort({ _id: -1 }).exec();
            if (ultimoEventoUsuario && ultimoEventoUsuario._id) {
                const match = ultimoEventoUsuario._id.match(/^EVU(\d{5})$/);
                if (match) {
                    const ultimoNumero = parseInt(match[1], 10);
                    const nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
                    nuevoID = `EVU${nuevoNumero}`;
                }
            }
        }

        eventosusuario._id = nuevoID;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("eventosusuario", EventosUsuarioSchema);