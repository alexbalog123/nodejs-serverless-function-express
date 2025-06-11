const express = require('express');
const router = express.Router();
const modelEntrenamientoRealizado = require('../models/modelsEntrenamientoRealizado'); 
//middleware para acceder 
router.get('/getAll', async (req, res) => {
    try{
    const data = await modelEntrenamientoRealizado.find();
    res.status(200).json(data);
    }
    catch(error){
    res.status(500).json({message: error.message});
    }
    });



router.get('/getLastEntrenamiento/:usuarioId', async (req, res) => {
    try{
        const usuarioId = req.params.usuarioId; // Obtener el ID del usuario de los parámetros de la ruta
        const data = await modelEntrenamientoRealizado.findOne({ usuario: usuarioId }).sort({ fecha: -1 }); // Ordenar por fecha de forma descendente y limitar a 1 resultado
        if (data.length === 0) {
            return res.status(404).json({ message: 'No se encontraron entrenamientos para este usuario' });
        }
        res.status(200).json(data);
    } catch(error){
        res.status(500).json({message: error.message});
    }
    });



router.post('/getOne', async (req, res) => {
    try{
    const id = req.body._id;
    const data = await modelEntrenamientoRealizado.findOne({ _id: id });
    if (!data) {
        return res.status(404).json({ message: 'Documento no encontrado' });
    }
    res.status(200).json(data);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
    });


router.post('/getFilter', async (req, res) => {
    try {
        const condiciones = {};

        if (req.body.duracion !== null && req.body.duracion !== undefined) {
            condiciones.duracion = req.body.duracion ;
        }

        if (req.body.fechaMin !== undefined || req.body.fechaMax !== undefined) {
            condiciones.fecha = {};
            if (req.body.fechaMin !== undefined) condiciones.fecha.$gte = req.body.fechaMin;
            if (req.body.fechaMax !== undefined) condiciones.fecha.$lte = req.body.fechaMax;
        }
        
        if (req.body.usuario !== null) {
            condiciones.usuario = req.body.usuario
        }

        const data = await modelEntrenamientoRealizado.find(condiciones);
        
        if (data.length === 0) {
            return res.status(404).json({ message: 'No hay entrenos hechos con tales características' });
        }
        
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/new', async (req, res) => {
    const data = new modelEntrenamientoRealizado({
        usuario: req.body.usuario,
        entrenamiento: req.body.entrenamiento,
        duracion: req.body.duracion,
        fecha: req.body.fecha,
        ejerciciosRealizados: req.body.ejerciciosRealizados
    })

    try {
    const dataToSave = await data.save();
    res.status(200).json(dataToSave);
    }
    catch (error) {
    res.status(400).json({message: error.message});
    }
    });

router.patch("/update", async (req, res) => {
    try {
    const id = req.body._id;

    const resultado = await modelEntrenamientoRealizado.updateOne(
    { _id: id }, { $set: {
        usuario: req.body.usuario,
        entrenamiento: req.body.entrenamiento,
        duracion: req.body.duracion,
        fecha: req.body.fecha,
        ejerciciosRealizados: req.body.ejerciciosRealizados
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


router.patch("/update/:id", async (req, res) => {
    try {
    const id = req.params.id;

    const resultado = await modelEntrenamientoRealizado.updateOne(
    { _id: id }, { $set: {
        usuario: req.body.usuario,
        entrenamiento: req.body.entrenamiento,
        duracion: req.body.duracion,
        fecha: req.body.fecha,
        ejerciciosRealizados: req.body.ejerciciosRealizados
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



router.delete('/delete', async (req, res) => {
    try {
    const id = req.body._id;
    const data = await modelEntrenamientoRealizado.deleteOne({ _id: id })
    if (data.deletedCount === 0) {
        return res.status(404).json({ message: 'Documento no encontrado' });
    }

    res.status(200).json({ message: `Document with ${id} has been deleted..` })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
    })

module.exports = router;