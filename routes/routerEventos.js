const express = require('express');
const router = express.Router();
const modelEventos = require('../models/modelsEventos'); 
const verifyToken = require('../middlewares/authMiddleware'); // Middleware de autenticación

//middleware para acceder 
router.get('/getAll', verifyToken, async (req, res) => {
    try{
    const data = await modelEventos.find();
    res.status(200).json(data);
    }
    catch(error){
    res.status(500).json({message: error.message});
    }
    });

router.post('/getOne', verifyToken, async (req, res) => {
    try{
    const id = req.body._id;
    const data = await modelEventos.findOne({ _id: id });
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

        if (req.body.nombre !== null && req.body.nombre.trim() !== "") {
            condiciones.nombre = req.body.nombre;
        }
        if (req.body.tipo !== null) {
            condiciones.tipo = req.body.tipo;
        }
        
        const data = await modelEventos.find(condiciones);
        
        if (data.length === 0) {
            return res.status(404).json({ message: 'No hay ejercicios con tales características' });
        }
        
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/new', verifyToken, async (req, res) => {
    const data = new modelEventos({
        nombre: req.body.nombre,
        tipo: req.body.tipo,
        descripcion: req.body.descripcion
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

    const resultado = await modelEventos.updateOne(
    { _id: id }, { $set: {
        nombre: req.body.nombre,
        tipo: req.body.tipo,
        descripcion: req.body.descripcion
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
        const data = await modelEventos.findById(id);
        if (data) {
            await data.deleteOne();
        } else {
            return res.status(404).json({ message: 'Documento no encontrado' });
        }
        
        res.status(200).json({ message: `Document with ${id} has been deleted..` })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
    })

module.exports = router;