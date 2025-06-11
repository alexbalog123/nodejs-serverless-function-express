const mongoose = require('mongoose');
const mensajeSchema = new mongoose.Schema({
    _id: { 
        type: String, 
    },
    conversacion: { 
        type: String, 
        required: true 
    },
    contenido: { 
        type: String, 
        required: true 
    },
    esDeUsuario: { 
        type: Boolean, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});



const CodigoLiberado = require('./modelsCodigosLiberados');

mensajeSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await CodigoLiberado.create({ codigo: this._id, tipo: 'mensaje' });
    next();
});

mensajeSchema.pre('save', async function (next) {
    const mensaje = this;
    if (!mensaje.isNew) return next();

    try {
        let nuevoID = "M00001";  // Código inicial si no hay liberados

        // Buscar código liberado del tipo 'mensaje'
        const codigoLiberado = await CodigoLiberado.findOne({ tipo: 'mensaje' }).sort({ codigo: 1 }).exec();
        
        if (codigoLiberado) {
            nuevoID = codigoLiberado.codigo;
            await CodigoLiberado.deleteOne({ codigo: nuevoID, tipo: 'mensaje' }); // Eliminarlo de la lista de liberados
        } else {
            // Si no hay códigos liberados, generar uno nuevo
            const ultimoMensaje = await this.constructor.findOne({}).sort({ _id: -1 }).exec();
            if (ultimoMensaje && ultimoMensaje._id) {
                const match = ultimoMensaje._id.match(/^M(\d{5})$/);
                if (match) {
                    const ultimoNumero = parseInt(match[1], 10);
                    const nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
                    nuevoID = `M${nuevoNumero}`;
                }
            }
        }

        mensaje._id = nuevoID;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("mensaje", mensajeSchema);