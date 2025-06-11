const express = require('express');
const router = express.Router();
const modelLikes = require('../models/modelsLikes');
const verifyToken = require('../middlewares/authMiddleware'); // Middleware para validar el JWT

//middleware para acceder 
router.get('/getAll', verifyToken, async (req, res) => {
    try{
    const data = await modelLikes.find();
    res.status(200).json(data);
    }
    catch(error){
    res.status(500).json({message: error.message});
    }
    });

router.post('/getOne', verifyToken, async (req, res) => {
    try{
    const id = req.body._id;
    const data = await modelLikes.findOne({ _id: id });
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

        if (req.body.entrenamiento !== null && req.body.entrenamiento.trim() !== "") {
            condiciones.entrenamiento = req.body.entrenamiento ;
        }
        if (req.body.usuario !== undefined) {
            condiciones.usuario = req.body.usuario;
        }
        const data = await modelLikes.find(condiciones);
        
        if (data.length === 0) {
            return res.status(404).json({ message: 'No hay ejercicios con tales características' });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/new', verifyToken, async (req, res) => {
    const data = new modelLikes({
        entrenamiento: req.body.entrenamiento,
        usuario: req.body.usuario
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

    const resultado = await modelLikes.updateOne(
    { _id: id }, { $set: {
        entrenamiento: req.body.entrenamiento,
        usuario: req.body.usuario
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
    const { entrenamiento, usuario } = req.body;
    const data = await modelLikes.deleteOne({ entrenamiento: entrenamiento, usuario: usuario })
    if (data.deletedCount === 0) {
        return res.status(404).json({ message: 'Documento no encontrado' });
    }

    res.status(200).json({ message: `El like con entrenamiento: ${entrenamiento} y usuario: ${usuario}` })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
    })

module.exports = router;