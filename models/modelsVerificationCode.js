const mongoose = require("mongoose");

const VerificationCodeSchema = mongoose.Schema({
    email: {
        required: true,
        type: String
    },
    code: {
        required: true,
        type: String
    },
    expiresAt: {
        required: true,
        type: Date,
        default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    __v: false,
    timestamps: true
});

// Índice para expiración automática
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Índice único por email para evitar códigos duplicados
VerificationCodeSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("VerificationCode", VerificationCodeSchema);