const express = require('express');
const router = express.Router();
const modelEventosUsuario = require('../models/modelsEventosUsuario'); 
const verifyToken = require('../middlewares/authMiddleware'); // Middleware de autenticación

//middleware para acceder 
router.get('/getAll', verifyToken, async (req, res) => {
    try{
        console.log("Accediendo a eventos de usuario");
        const data = await modelEventosUsuario.find();
        res.status(200).json(data);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
});



router.get('/getEventosProximos/:usuarioId', async (req, res) => {
    try{
        const usuarioId = req.params.usuarioId; // Obtener el ID del usuario de los parámetros de la ruta
        const data = await modelEventosUsuario.find({ usuario: usuarioId }).sort({ fecha: 1 }); // Ordenar por fecha de forma ascendente
        if (data.length === 0) {
            return res.status(404).json({ message: 'No se encontraron eventos para este usuario' });
        }
        res.status(200).json(data);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
});

router.post('/getOne', verifyToken, async (req, res) => {
    try{
    const id = req.body._id;
    const data = await modelEventosUsuario.findOne({ _id: id });
    if (!data) {
        return res.status(404).json({ message: 'Documento no encontrado' });
    }
    res.status(200).json(data);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
    });


router.post('/getFilter', verifyToken, async (req, res) => {
    try {
        const condiciones = {};

        if (typeof req.body.usuario !== null && req.body.usuario !== undefined) {
            condiciones.usuario = req.body.usuario;
        }
        if (typeof req.body.fecha !== null && req.body.fecha !== undefined) {
            condiciones.fecha = req.body.fecha;
        }
        if (typeof req.body.evento !== null && req.body.evento !== undefined) {
            condiciones.evento = req.body.evento;
        }
        const data = await modelEventosUsuario.find(condiciones);
        
        if (data.length === 0) {
            return res.status(404).json({ message: 'No hay ejercicios con tales características' });
        }
        
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/new', verifyToken, async (req, res) => {
    const data = new modelEventosUsuario({
        evento: req.body.evento,
        usuario: req.body.usuario,
        fecha: req.body.fecha,
        hora: req.body.hora,
        notas: req.body.notas
    })

    try {
    const dataToSave = await data.save();
    res.status(200).json(dataToSave);
    }
    catch (error) {
    res.status(400).json({message: error.message});
    }
    });

router.patch("/update", verifyToken, async (req, res) => {
    try {
    const id = req.body._id;

    const resultado = await modelEventosUsuario.updateOne(
    { _id: id }, { $set: {
        evento: req.body.evento,
        usuario: req.body.usuario,
        fecha: req.body.fecha,
        hora: req.body.hora,
        notas: req.body.notas
    }});
    
    if (resultado.modifiedCount === 0) {
        return res.status(404).json({ message: "Documento no encontrado" });
    }
    
    res.status(200).json({ message: "Documento actualizado exitosamente"
    });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/delete', verifyToken, async (req, res) => {
    try {
    const id = req.body._id;
    const data = await modelEventosUsuario.deleteOne({ _id: id })
    if (data.deletedCount === 0) {
        return res.status(404).json({ message: 'Documento no encontrado' });
    }

    res.status(200).json({ message: `Document with ${id} has been deleted..` })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
});


module.exports = router;