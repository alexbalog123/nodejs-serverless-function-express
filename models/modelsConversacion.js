const mongoose = require("mongoose");
const conversacionSchema = new mongoose.Schema({
    _id: { 
        type: String, 
    },
    usuario: { 
        type: String,
        required: true 
    },
    titulo: { 
        type: String, 
        default: 'Nueva conversación' 
    },
    categoria: { 
        type: String, 
        enum: ['nutricion', 'entrenamiento', 'habitos'], 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});



const CodigoLiberado = require('./modelsCodigosLiberados');

conversacionSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await CodigoLiberado.create({ codigo: this._id, tipo: 'conversacion' });
    next();
});

conversacionSchema.pre('save', async function (next) {
    const conversacion = this;
    if (!conversacion.isNew) return next();

    try {
        let nuevoID = "C00001";  // Código inicial si no hay liberados

        // Buscar código liberado del tipo 'conversacion'
        const codigoLiberado = await CodigoLiberado.findOne({ tipo: 'conversacion' }).sort({ codigo: 1 }).exec();
        
        if (codigoLiberado) {
            nuevoID = codigoLiberado.codigo;
            await CodigoLiberado.deleteOne({ codigo: nuevoID, tipo: 'conversacion' }); // Eliminarlo de la lista de liberados
        } else {
            // Si no hay códigos liberados, generar uno nuevo
            const ultimaConversacion = await this.constructor.findOne({}).sort({ _id: -1 }).exec();
            if (ultimaConversacion && ultimaConversacion._id) {
                const match = ultimaConversacion._id.match(/^C(\d{5})$/);
                if (match) {
                    const ultimoNumero = parseInt(match[1], 10);
                    const nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
                    nuevoID = `C${nuevoNumero}`;
                }
            }
        }

        conversacion._id = nuevoID;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("conversacion", conversacionSchema);