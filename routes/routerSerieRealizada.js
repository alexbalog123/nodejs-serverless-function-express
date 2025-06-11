const express = require('express');
const router = express.Router();
const modelSerieRealizada = require('../models/modelsSerieRealizada'); 
const verifyToken = require('../middlewares/authMiddleware'); // Middleware de autenticación

//middleware para acceder 
router.get('/getAll', verifyToken, async (req, res) => {
    try{
    const data = await modelSerieRealizada.find();
    res.status(200).json(data);
    }
    catch(error){
    res.status(500).json({message: error.message});
    }
    });

router.post('/getOne', verifyToken, async (req, res) => {
    try{
    const id = req.body._id;
    const data = await modelSerieRealizada.findOne({ _id: id });
    if (!data) {
        return res.status(404).json({ message: 'Documento no encontrado' });
    }
    console.log("Respuesta exitosa: Código 200", dataToSave); // Log para éxito
    res.status(200).json(data);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
});

router.post('/new', verifyToken, async (req, res) => {
    const data = new modelSerieRealizada({
        ejercicio: req.body.ejercicio,
        ejercicioRealizado: req.body.ejercicioRealizado,
        numeroSerie: req.body.numeroSerie,
        repeticiones: req.body.repeticiones,
        peso: req.body.peso
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

    const resultado = await modelSerieRealizada.updateOne(
    { _id: id }, { $set: {
        ejercicio: req.body.ejercicio,
        ejercicioRealizado: req.body.ejercicioRealizado,
        numeroSerie: req.body.numeroSerie,
        repeticiones: req.body.repeticiones,
        peso: req.body.peso
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

router.patch("/update", verifyToken, async (req, res) => {
    try {
    const id = req.body._id;

    const resultado = await modelSerieRealizada.updateOne(
    { _id: id }, { $set: {
        ejercicio: req.body.ejercicio,
        ejercicioRealizado: req.body.ejercicioRealizado,
        numeroSerie: req.body.numeroSerie,
        repeticiones: req.body.repeticiones,
        peso: req.body.peso
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
    const data = await modelSerieRealizada.deleteOne({ _id: id })
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
            ejercicio,
            ejercicioRealizado,
            numeroSerie,
            repeticiones,
            peso
        } = req.body;

        const condiciones = {};

        if (ejercicio && ejercicio.trim() !== "") {
            condiciones.ejercicio = ejercicio.trim(); // búsqueda parcial e insensible a mayúsculas
        }

        if (ejercicioRealizado && ejercicioRealizado.trim() !== "") {
            condiciones.ejercicioRealizado = ejercicioRealizado.trim();
        }

        if (numeroSerie != undefined && numeroSerie != null) {
            condiciones.numeroSerie = musculoPrincipal; 
        }

        if (repeticiones != undefined && repeticiones != null) {
            condiciones.repeticiones = repeticiones; 
        }

        if (peso != undefined && peso != null) {
            condiciones.peso = peso; 
        }

        const data = await modelSerieRealizada.find(condiciones);

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