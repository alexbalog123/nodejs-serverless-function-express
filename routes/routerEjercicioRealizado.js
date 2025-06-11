const express = require('express');
const router = express.Router();
const modelEjercicioRealizado = require('../models/modelsEjercicioRealizado'); 
const verifyToken = require('../middlewares/authMiddleware'); //middleware para verificar el token

//middleware para acceder 
router.get('/getAll', verifyToken, async (req, res) => {
    try{
    const data = await modelEjercicioRealizado.find();
    res.status(200).json(data);
    }
    catch(error){
    res.status(500).json({message: error.message});
    }
    });

router.post('/getOne', verifyToken, async (req, res) => {
    try{
    const id = req.body._id;
    const data = await modelEjercicioRealizado.findOne({ _id: id });
    if (!data) {
        return res.status(404).json({ message: 'Documento no encontrado' });
    }
    res.status(200).json(data);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
});

router.post('/new', verifyToken, async (req, res) => {
    const data = new modelEjercicioRealizado({
        entrenamiento: req.body.entrenamiento,
        entrenamientoRealizado: req.body.entrenamientoRealizado,
        ejercicio: req.body.ejercicio,
        nombre: req.body.nombre
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

    const resultado = await modelEjercicioRealizado.updateOne(
    { _id: id }, { $set: {
        entrenamiento: req.body.entrenamiento,
        entrenamientoRealizado: req.body.entrenamientoRealizado,
        ejercicio: req.body.ejercicio,
        nombre: req.body.nombre,
        seriesRealizadas: req.body.seriesRealizadas
    },});
    
    if (resultado.modifiedCount === 0) {
        return res.status(404).json({ message: "Documento no encontrado" });
    }
    
    res.status(200).json({ message: "Documento actualizado exitosamente"
    });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.patch("/update/:id", verifyToken, async (req, res) => {
    try {
    const id = req.params.id;

    const resultado = await modelEjercicioRealizado.updateOne(
    { _id: id }, { $set: {
        entrenamiento: req.body.entrenamiento,
        entrenamientoRealizado: req.body.entrenamientoRealizado,
        ejercicio: req.body.ejercicio,
        nombre: req.body.nombre,
        seriesRealizadas: req.body.seriesRealizadas
    },});
    
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
    const data = await modelEjercicioRealizado.deleteOne({ _id: id })
    if (data.deletedCount === 0) {
        return res.status(404).json({ message: 'Documento no encontrado' });
    }

    res.status(200).json({ message: `Document with ${id} has been deleted..` })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
});


router.post('/getFilter', verifyToken, async (req, res) => {
    try {
        const {
            entrenamientoRealizado,
            entrenamiento,
            ejercicio,
            nombre
        } = req.body;

        const condiciones = {};

        if (ejercicio && ejercicio.trim() !== "") {
            condiciones.ejercicio = ejercicio.trim(); // búsqueda parcial e insensible a mayúsculas
        }

        if (entrenamientoRealizado && entrenamientoRealizado.trim() !== "") {
            condiciones.entrenamientoRealizado = entrenamientoRealizado.trim();
        }

        if (entrenamiento && entrenamiento.trim() !== "") {
            condiciones.entrenamiento = entrenamiento.trim();
        }

        if (nombre && nombre.trim() !== "") {
            condiciones.nombre = nombre.trim();
        }

        const data = await modelEjercicioRealizado.find(condiciones);

        if (data.length === 0) {
            return res.status(404).json({ message: 'No se encontraron series con esas características' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Error en /getFilter:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;