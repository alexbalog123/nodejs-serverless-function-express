const express = require('express');
const router = express.Router();
const modelGuardados = require('../models/modelsGuardados');
const verifyToken = require('../middlewares/authMiddleware'); // Middleware para validar el JWT

//middleware para acceder 
router.get('/getAll', verifyToken, async (req, res) => {
    try{
    const data = await modelGuardados.find();
    res.status(200).json(data);
    }
    catch(error){
    res.status(500).json({message: error.message});
    }
    });

router.post('/getOne', verifyToken, async (req, res) => {
    try{
    const id = req.body._id;
    const data = await modelGuardados.findOne({ _id: id });
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
        
        if (req.body.entrenamiento && req.body.entrenamiento.trim() !== "") {
            condiciones.entrenamiento = req.body.entrenamiento.trim();
        }
        if (req.body.usuario && req.body.usuario.trim() !== "") {
            condiciones.usuario = req.body.usuario.trim();
        }

        const data = await modelGuardados.find(condiciones);

        if (data.length === 0) {
            return res.status(404).json({ message: 'No hay ejercicios con tales características' });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/new', verifyToken, async (req, res) => {
    const data = new modelGuardados({
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

    const resultado = await modelGuardados.updateOne(
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
    const data = await modelGuardados.deleteOne({ entrenamiento: entrenamiento, usuario: usuario })
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