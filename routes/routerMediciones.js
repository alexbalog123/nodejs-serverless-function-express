const express = require('express');
const router = express.Router();
const modelMediciones = require('../models/modelsMediciones');
const verifyToken = require('../middlewares/authMiddleware'); // Asumiendo que tienes un middleware de autenticación

// Middleware para verificar si una medición existe
async function verificarMedicionExiste(req, res, next) {
    try {
        const medicion = await modelMediciones.findById(req.params.id);
        if (!medicion) {
            return res.status(404).json({ error: 'Medición no encontrada' });
        }
        req.medicion = medicion;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar la medición: ' + error.message });
    }
}

// GET - Obtener todas las mediciones (con paginación)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        
        const mediciones = await modelMediciones.find()
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ fecha: -1 });
            
        const total = await modelMediciones.countDocuments();
        
        res.status(200).json({
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            mediciones
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener mediciones: ' + error.message });
    }
});

// GET - Obtener una medición específica por ID
router.get('/:id', verifyToken, verificarMedicionExiste, (req, res) => {
    res.status(200).json(req.medicion);
});

// GET - Obtener mediciones por usuario
router.get('/usuario/:usuarioId', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, tipo, fechaInicio, fechaFin } = req.query;
        const skip = (page - 1) * limit;
        
        // Construir filtro
        const filtro = { usuario: req.params.usuarioId };
        
        // Añadir filtro de tipo si se especifica
        if (tipo) {
            filtro.tipo = tipo.toUpperCase();
        }
        
        // Añadir filtro de fecha si se especifica
        if (fechaInicio || fechaFin) {
            filtro.fecha = {};
            if (fechaInicio) filtro.fecha.$gte = new Date(fechaInicio);
            if (fechaFin) filtro.fecha.$lte = new Date(fechaFin);
        }
        
        const mediciones = await modelMediciones.find(filtro)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ fecha: -1 });
            
        const total = await modelMediciones.countDocuments(filtro);
        
        res.status(200).json({
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            mediciones
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener mediciones del usuario: ' + error.message });
    }
});

// POST - Crear nueva medición
router.post('/', verifyToken, async (req, res) => {
    try {
        // Si no se especifica la fecha, usar la fecha actual
        if (!req.body.fecha) {
            req.body.fecha = new Date();
        }
        
        // Crear la nueva medición
        const nuevaMedicion = new modelMediciones(req.body);
        
        // Guardar en la base de datos
        const medicionGuardada = await nuevaMedicion.save();
        
        res.status(201).json(medicionGuardada);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación: ' + error.message });
        }
        res.status(500).json({ error: 'Error al crear medición: ' + error.message });
    }
});

// PUT - Actualizar una medición
router.put('/:id', verifyToken, verificarMedicionExiste, async (req, res) => {
    try {
        // Campos que no se pueden modificar
        delete req.body._id;
        delete req.body.usuario;
        
        // Actualizar la medición
        const medicionActualizada = await modelMediciones.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        
        res.status(200).json(medicionActualizada);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación: ' + error.message });
        }
        res.status(500).json({ error: 'Error al actualizar medición: ' + error.message });
    }
});

// DELETE - Eliminar una medición
router.delete('/:id', verifyToken, verificarMedicionExiste, async (req, res) => {
    try {
        await req.medicion.deleteOne();
        res.status(200).json({ message: 'Medición eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar medición: ' + error.message });
    }
});

// GET - Obtener estadísticas básicas para un usuario y tipo de medición
router.get('/estadisticas/:usuarioId', verifyToken, async (req, res) => {
    try {
        const { tipo = 'PESO' } = req.query;
        const usuarioId = req.params.usuarioId;
        
        // Obtener la última medición
        const ultimaMedicion = await modelMediciones.findOne({
            usuario: usuarioId,
            tipo: tipo.toUpperCase()
        }).sort({ fecha: -1 });
        
        // Obtener la primera medición
        const primeraMedicion = await modelMediciones.findOne({
            usuario: usuarioId,
            tipo: tipo.toUpperCase()
        }).sort({ fecha: 1 });
        
        // Obtener el promedio
        const agregacion = await modelMediciones.aggregate([
            { $match: { usuario: usuarioId, tipo: tipo.toUpperCase() } },
            { $group: {
                _id: null,
                promedio: { $avg: "$valor" },
                maximo: { $max: "$valor" },
                minimo: { $min: "$valor" },
                total: { $sum: 1 }
            }}
        ]);
        
        const estadisticas = agregacion.length > 0 ? agregacion[0] : { promedio: 0, maximo: 0, minimo: 0, total: 0 };
        
        // Calcular cambio desde la primera medición
        let cambio = 0;
        let porcentajeCambio = 0;
        
        if (ultimaMedicion && primeraMedicion) {
            cambio = ultimaMedicion.valor - primeraMedicion.valor;
            porcentajeCambio = primeraMedicion.valor !== 0 ? 
                (cambio / primeraMedicion.valor) * 100 : 0;
        }
        
        res.status(200).json({
            tipo: tipo.toUpperCase(),
            ultimo: ultimaMedicion ? ultimaMedicion.valor : null,
            cambio,
            porcentajeCambio,
            promedio: estadisticas.promedio,
            maximo: estadisticas.maximo,
            minimo: estadisticas.minimo,
            totalMediciones: estadisticas.total,
            unidad: ultimaMedicion ? ultimaMedicion.unidad : ''
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas: ' + error.message });
    }
});

module.exports = router;