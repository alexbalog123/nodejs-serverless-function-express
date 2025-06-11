const mongoose = require("mongoose");
const EntrenamientoRealizadoSchema = mongoose.Schema({
    _id: { type: String },
    usuario: {
        required: true,
        type: String
    },
    entrenamiento: {
        required: true,
        type: String
    },
    duracion: {
        required: true,
        type: String
    },
    fecha: {
        required: true,
        type: Date
    },
    ejerciciosRealizados: {
        required: true,
        type: [String]
    }
});

const CodigoLiberado = require('./modelsCodigosLiberados');

EntrenamientoRealizadoSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await CodigoLiberado.create({ codigo: this._id, tipo: 'EntrenamientoRealizado' });
    next();
});

EntrenamientoRealizadoSchema.pre('save', async function (next) {
    const EntrenamientoRealizado = this;
    if (!EntrenamientoRealizado.isNew) return next();

    try {
        let nuevoID = "ER00001";  // Código inicial si no hay liberados

        // Buscar código liberado del tipo 'EntrenamientoRealizado'
        const codigoLiberado = await CodigoLiberado.findOne({ tipo: 'EntrenamientoRealizado' }).sort({ codigo: 1 }).exec();
        
        if (codigoLiberado) {
            nuevoID = codigoLiberado.codigo;
            await CodigoLiberado.deleteOne({ codigo: nuevoID, tipo: 'EntrenamientoRealizado' }); // Eliminarlo de la lista de liberados
        } else {
            // Si no hay códigos liberados, generar uno nuevo
            const ultimoEntrenamientoRealizado = await this.constructor.findOne({}).sort({ _id: -1 }).exec();
            if (ultimoEntrenamientoRealizado && ultimoEntrenamientoRealizado._id) {
                const match = ultimoEntrenamientoRealizado._id.match(/^ER(\d{5})$/);
                if (match) {
                    const ultimoNumero = parseInt(match[1], 10);
                    const nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
                    nuevoID = `ER${nuevoNumero}`;
                }
            }
        }

        EntrenamientoRealizado._id = nuevoID;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("EntrenamientoRealizado", EntrenamientoRealizadoSchema);