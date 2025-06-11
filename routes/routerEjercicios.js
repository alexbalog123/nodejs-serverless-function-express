const express = require('express');
const router = express.Router();
const modelEjercicios = require('../models/modelsEjercicios'); 
const verifyToken = require('../middlewares/authMiddleware'); // Middleware de autenticación

//middleware para acceder 
router.get('/getAll', verifyToken, async (req, res) => {
    try{
    const data = await modelEjercicios.find();
    res.status(200).json(data);
    }
    catch(error){
    res.status(500).json({message: error.message});
    }
    });

router.post('/getOne', verifyToken, async (req, res) => {
    try{
    const id = req.body._id;
    const ejerciciosDB = await modelEjercicios.findOne({ _id: id });
    if (!ejerciciosDB) {
        return res.status(404).json({ message: 'Documento no encontrado' });
    }
    res.status(200).json(ejerciciosDB);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
    });


router.post('/getFilter', verifyToken, async (req, res) => {
    try {
        const {
            nombre,
            musculo,
            sortBy = 'nombre',
            sortDirection = 'asc'
        } = req.body;

        const condiciones = {};

        if (nombre && nombre.trim() !== "") {
            condiciones.nombre = { $regex: nombre.trim(), $options: 'i' }; // búsqueda parcial
        }

        if (musculo && musculo.trim() !== "") {
            condiciones.musculo = musculo.trim();
        }

        // Configuración de orden
        const sortOptions = {};
        sortOptions[sortBy] = sortDirection === 'desc' ? -1 : 1;

        const ejercicios = await modelEjercicios.find(condiciones).sort(sortOptions);

        if (ejercicios.length === 0) {
            return res.status(404).json({ message: "No se encontraron ejercicios con esas características" });
        }

        res.status(200).json(ejercicios);
    } catch (error) {
        console.error("Error en /getFilter ejercicios:", error);
        res.status(500).json({ message: error.message });
    }
});


router.post('/new', verifyToken, async (req, res) => {
    const data = new modelEjercicios({
        nombre: req.body.nombre,
        musculo: req.body.musculo,
        descripcion: req.body.descripcion,
        foto: req.body.foto,
        consejos: req.body.consejos,
        tutorial: req.body.tutorial
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

    const resultado = await modelEjercicios.updateOne(
    { _id: id }, { $set: {
        nombre: req.body.nombre,
        musculo: req.body.musculo,
        descripcion: req.body.descripcion,
        foto: req.body.foto,
        consejos: req.body.consejos,
        tutorial: req.body.tutorial
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
        const data = await modelEjercicios.findById(id);
        if (data) {
            await data.deleteOne();
        } else {
            return res.status(404).json({ message: 'Documento no encontrado' });
        }
        
        res.status(200).json({ message: `Document with ${id} has been deleted..` })
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

module.exports = router;