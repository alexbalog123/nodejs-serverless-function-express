const mongoose = require("mongoose");
const EntrenamientosSchema = mongoose.Schema({
    _id: { type: String },
    categoria: {
        required: true,
        type: String
    },
    musculoPrincipal: {
        required: true,
        type: String
    },
    nombre: {
        required: true,
        type: String
    },
    duracion: {
        required: true,
        type: Number
    },
    foto: {
        required: true,
        type: String
    },
    musculo: {
        required: true,
        type: [String],
        default: []
    },
    likes: {
        type: Number,
        default: 0
    },
    ejercicios: {
        required: true,
        type: [String],
        default: []
    },
    creador: {
        required: true,
        type: String
    },
    aprobado: {
        type: Boolean,
        default: false
    },
    pedido: {
        type: Boolean,
        default: false
    },
    motivoRechazo: {
        type: String
    },
    baja: {
        type: Boolean,
        default: false
    },
    fechaBaja: {
        type: Date,
        default: null
    }
})

const CodigoLiberado = require('./modelsCodigosLiberados');

EntrenamientosSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await CodigoLiberado.create({ codigo: this._id, tipo: 'entrenamientos' });
    next();
});

EntrenamientosSchema.pre('save', async function (next) {
    const entrenamientos = this;
    if (!entrenamientos.isNew) return next();

    try {
        let nuevoID = "ET00001";  // Código inicial si no hay liberados

        // Buscar código liberado del tipo 'entrenamientos'
        const codigoLiberado = await CodigoLiberado.findOne({ tipo: 'entrenamientos' }).sort({ codigo: 1 }).exec();
        
        if (codigoLiberado) {
            nuevoID = codigoLiberado.codigo;
            await CodigoLiberado.deleteOne({ codigo: nuevoID, tipo: 'entrenamientos' }); // Eliminarlo de la lista de liberados
        } else {
            // Si no hay códigos liberados, generar uno nuevo
            const ultimoEntrenamiento = await this.constructor.findOne({}).sort({ _id: -1 }).exec();
            if (ultimoEntrenamiento && ultimoEntrenamiento._id) {
                const match = ultimoEntrenamiento._id.match(/^ET(\d{5})$/);
                if (match) {
                    const ultimoNumero = parseInt(match[1], 10);
                    const nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
                    nuevoID = `ET${nuevoNumero}`;
                }
            }
        }

        entrenamientos._id = nuevoID;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("entrenamientos", EntrenamientosSchema);