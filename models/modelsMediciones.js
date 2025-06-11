const mongoose = require("mongoose");
const MedicionesSchema = new mongoose.Schema({
    _id: { type: String },
    usuario: { 
        required: true, 
        type: String
    },
    fecha: {
        required: true,
        type: Date
    },
    tipo: {
        required: true,
        type: String,
        enum: ['PESO', 'CALORIAS', 'EJERCICIO_TIEMPO', 'EJERCICIO_CALORIAS', 'IMC'],
        uppercase: true
    },
    unidad: {
    type: String,
    default: function() {
        switch(this.tipo) {
            case 'PESO': return 'kg';
            case 'CALORIAS': return 'kcal';
            case 'EJERCICIO_TIEMPO': return 'min';
            default: return '';
        }
    }
},
    valor: {
        required: true,
        type: Number
    },
    notas: {
        type: String
    }
}, {__v: false});

const CodigoLiberado = require('./modelsCodigosLiberados');

MedicionesSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await CodigoLiberado.create({ codigo: this._id, tipo: 'mediciones' });
    next();
});

MedicionesSchema.pre('save', async function (next) {
    const mediciones = this;
    if (!mediciones.isNew) return next();

    try {
        let nuevoID = "MD00001";  // Código inicial si no hay liberados

        // Buscar código liberado del tipo 'mediciones'
        const codigoLiberado = await CodigoLiberado.findOne({ tipo: 'mediciones' }).sort({ codigo: 1 }).exec();
        
        if (codigoLiberado) {
            nuevoID = codigoLiberado.codigo;
            await CodigoLiberado.deleteOne({ codigo: nuevoID, tipo: 'mediciones' }); // Eliminarlo de la lista de liberados
        } else {
            // Si no hay códigos liberados, generar uno nuevo
            const ultimoEvento = await this.constructor.findOne({}).sort({ _id: -1 }).exec();
            if (ultimoEvento && ultimoEvento._id) {
                const match = ultimoEvento._id.match(/^MD(\d{5})$/);
                if (match) {
                    const ultimoNumero = parseInt(match[1], 10);
                    const nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
                    nuevoID = `MD${nuevoNumero}`;
                }
            }
        }

        mediciones._id = nuevoID;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("mediciones", MedicionesSchema);