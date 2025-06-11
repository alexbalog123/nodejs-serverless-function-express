const mongoose = require("mongoose");
const SerieRealizadaSchema = mongoose.Schema({
    _id: { type: String },
    ejercicio: {
        required: true,
        type: String
    },
    ejercicioRealizado: {
        type: String
    },
    numeroSerie: {
        required: true,
        type: Number
    },
    repeticiones: {
        required: true,
        type: Number
    },
    peso: {
        required: true,
        type: Number
    }
})

const CodigoLiberado = require('./modelsCodigosLiberados');
const e = require("express");

SerieRealizadaSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await CodigoLiberado.create({ codigo: this._id, tipo: 'SerieRealizada' });
    next();
});

SerieRealizadaSchema.pre('save', async function (next) {
    const serieRealizada = this;
    if (!serieRealizada.isNew) return next();

    try {
        let nuevoID = "SR00001";  // Código inicial si no hay liberados

        // Buscar código liberado del tipo 'SerieRealizada'
        const codigoLiberado = await CodigoLiberado.findOne({ tipo: 'SerieRealizada' }).sort({ codigo: 1 }).exec();
        
        if (codigoLiberado) {
            nuevoID = codigoLiberado.codigo;
            await CodigoLiberado.deleteOne({ codigo: nuevoID, tipo: 'SerieRealizada' }); // Eliminarlo de la lista de liberados
        } else {
            // Si no hay códigos liberados, generar uno nuevo
            const ultimaSerieRealizada = await this.constructor.findOne({}).sort({ _id: -1 }).exec();
            if (ultimaSerieRealizada && ultimaSerieRealizada._id) {
                const match = ultimaSerieRealizada._id.match(/^SR(\d{5})$/);
                if (match) {
                    const ultimoNumero = parseInt(match[1], 10);
                    const nuevoNumero = (ultimoNumero + 1).toString().padStart(5, '0');
                    nuevoID = `SR${nuevoNumero}`;
                }
            }
        }

        serieRealizada._id = nuevoID;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("SerieRealizada", SerieRealizadaSchema);