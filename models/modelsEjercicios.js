const mongoose = require("mongoose");
const EjerciciosSchema = new mongoose.Schema({
    _id: { type: String },
    nombre: { 
        required: true, 
        type: String
    },
    musculo: {
        required: true,
        type: String
    },
    descripcion: {
        required: true,
        type: String
    },
    foto: {
        required: true,
        type: String
    },
    consejos: {
        required: true,
        type: [String]
    },
    tutorial: {
        requiered: true,
        type: String
    }
}, {__v: false});

const CodigoLiberado = require('./modelsCodigosLiberados');

EjerciciosSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await CodigoLiberado.create({ codigo: this._id, tipo: 'ejercicios' });
    next();
});

EjerciciosSchema.pre('save', async function (next) {
    const ejercicios = this;
    if (!ejercicios.isNew) return next();

    try {
        let nuevoID = "E00001";  // Código inicial si no hay liberados

        // Buscar código liberado del tipo 'ejercicios'
        const codigoLiberado = await CodigoLiberado.findOne({ tipo: 'ejercicios' }).sort({ codigo: 1 }).exec();
        
        if (codigoLiberado) {
            nuevoID = codigoLiberado.codigo;
            await CodigoLiberado.deleteOne({ codigo: nuevoID, tipo: 'ejercicios' }); // Eliminarlo de la lista de liberados
        } else {
            // Si no hay códigos liberados, generar uno nuevo
            const ultimoEjercicio = await this.constructor.findOne({}).sort({ _id: -1 }).exec();
            if (ultimoEjercicio && ultimoEjercicio._id) {
                const match = ultimoEjercicio._id.match(/^E(\d{5})$/);
                if (match) {
                    const ultimoNumero = parseInt(match[1], 10);
                    const nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
                    nuevoID = `E${nuevoNumero}`;
                }
            }
        }

        ejercicios._id = nuevoID;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("ejercicios", EjerciciosSchema);