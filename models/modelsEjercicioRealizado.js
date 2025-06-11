const mongoose = require("mongoose");
const EjercicioRealizadoSchema = mongoose.Schema({
    _id: { type: String },
    entrenamientoRealizado: {
        type: String
    },
    entrenamiento: {
        required: true,
        type: String
    },
    ejercicio: {
        required: true,
        type: String
    },
    nombre: {
        required: true,
        type: String
    },
    seriesRealizadas: {
        type: [String],
        default: []
    }
})

const CodigoLiberado = require('./modelsCodigosLiberados');

EjercicioRealizadoSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await CodigoLiberado.create({ codigo: this._id, tipo: 'EjercicioRealizado' });
    next();
});

EjercicioRealizadoSchema.pre('save', async function (next) {
    const realizar = this;
    if (!realizar.isNew) return next();

    try {
        let nuevoID = "EJR00001";  // Código inicial si no hay liberados

        // Buscar código liberado del tipo 'EjercicioRealizado'
        const codigoLiberado = await CodigoLiberado.findOne({ tipo: 'EjercicioRealizado' }).sort({ codigo: 1 }).exec();
        
        if (codigoLiberado) {
            nuevoID = codigoLiberado.codigo;
            await CodigoLiberado.deleteOne({ codigo: nuevoID, tipo: 'EjercicioRealizado' }); // Eliminarlo de la lista de liberados
        } else {
            // Si no hay códigos liberados, generar uno nuevo
            const ultimoRealizar = await this.constructor.findOne({}).sort({ _id: -1 }).exec();
            if (ultimoRealizar && ultimoRealizar._id) {
                const match = ultimoRealizar._id.match(/^EJR(\d{5})$/);
                if (match) {
                    const ultimoNumero = parseInt(match[1], 10);
                    const nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
                    nuevoID = `EJR${nuevoNumero}`;
                }
            }
        }

        realizar._id = nuevoID;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("EjercicioRealizado", EjercicioRealizadoSchema);