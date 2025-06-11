const express = require('express');
const router = express.Router();
const modelEntrenamientos = require('../models/modelsEntrenamientos'); 
const verifyToken = require('../middlewares/authMiddleware'); //middleware para verificar el token
const modelEntrenamientoRealizado = require('../models/modelsEntrenamientoRealizado');
const modelEjercicioRealizado = require('../models/modelsEjercicioRealizado');
const modelSerieRealizada = require('../models/modelsSerieRealizada');
const modelGuardados = require('../models/modelsGuardados');
const modelLikes = require('../models/modelsLikes');

//middleware para acceder 
router.get('/getAll', verifyToken, async (req, res) => {
    try{
        const data = await modelEntrenamientos.find();
        res.status(200).json(data);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
    });

router.post('/getOne', verifyToken, async (req, res) => {
    try{
        const id = req.body._id;
        const entrenamientosDB = await modelEntrenamientos.findOne({ _id: id });
    if (!entrenamientosDB) {
        return res.status(404).json({ message: 'Documento no encontrado' });
    }
    res.status(200).json(entrenamientosDB);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
    });


router.post('/getFilter', verifyToken, async (req, res) => {
    try {
        const {
            nombre,
            categoria,
            musculoPrincipal,
            duracionMin,
            duracionMax,
            creador,
            aprobado,
            pedido,
            baja,
            sortBy = 'nombre',
            sortDirection = 'asc'
        } = req.body;

        const condiciones = {};

        if (nombre && nombre.trim() !== "") {
            condiciones.nombre = { $regex: nombre.trim(), $options: 'i' }; // búsqueda parcial e insensible a mayúsculas
        }

        if (categoria && categoria.trim() !== "") {
            condiciones.categoria = categoria.trim();
        }

        if (musculoPrincipal && musculoPrincipal.trim() !== "") {
            condiciones.musculoPrincipal = musculoPrincipal.trim(); 
        }

        if (duracionMin != null || duracionMax != null) {
            condiciones.duracion = {};
            if (duracionMin != null) condiciones.duracion.$gte = Number(duracionMin);
            if (duracionMax != null) condiciones.duracion.$lte = Number(duracionMax);
        }

        if (creador && creador.trim() !== "") {
            condiciones.creador = creador.trim();
        }

        if (typeof aprobado === "boolean") {
            condiciones.aprobado = aprobado;
        }

        if (typeof pedido === "boolean") {
            condiciones.pedido = pedido;
        }

        if (typeof baja === "boolean") {
            condiciones.baja = baja;
        }

        // Ordenamiento
        const sortOptions = {};
        sortOptions[sortBy] = sortDirection === 'desc' ? -1 : 1;

        const data = await modelEntrenamientos.find(condiciones).sort(sortOptions);

        if (data.length === 0) {
            return res.status(404).json({ message: 'No se encontraron entrenamientos con esas características' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Error en /getFilter:", error);
        res.status(500).json({ message: error.message });
    }
});

router.patch('/darDeBaja/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.body.id;
        const updateData = req.body;

        // Buscar el entrenamiento
        const entrenamiento = await modelEntrenamientos.findById(id);
        
        if (!entrenamiento) {
            return res.status(404).json({
                success: false,
                message: 'Entrenamiento no encontrado'
            });
        }

        // Verificar que el usuario sea el creador del entrenamiento)
        if (entrenamiento.creador.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para modificar este entrenamiento'
            });
        }

        // Si se está dando de baja (activo = false), agregar fecha de baja
        if (updateData.activo === 'false' || updateData.activo === false) {
            updateData.activo = false;
            updateData.fechaBaja = new Date();
        }

        // Si se está reactivando (activo = true), limpiar fecha de baja
        if (updateData.activo === 'true' || updateData.activo === true) {
            updateData.activo = true;
            updateData.fechaBaja = null;
        }

        // Actualizar el entrenamiento
        const entrenamientoActualizado = await modelEntrenamientos.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Entrenamiento actualizado exitosamente',
            data: entrenamientoActualizado
        });

    } catch (error) {
        console.error('Error al actualizar entrenamiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});


router.post('/new', verifyToken, async (req, res) => {
    const data = new modelEntrenamientos({
        nombre: req.body.nombre,
        categoria: req.body.categoria,
        musculo: req.body.musculo,
        musculoPrincipal: req.body.musculoPrincipal,
        duracion: req.body.duracion,
        foto: req.body.foto,
        likes: 0,
        ejercicios: req.body.ejercicios,
        creador: req.body.creador,
        pedido: req.body.pedido,
        aprobado: req.body.aprobado,
        motivoRechazo: "",
        baja: req.body.baja,
        fechaBaja: req.body.fechaBaja
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

    const resultado = await modelEntrenamientos.updateOne(
    { _id: id }, { $set: {
        nombre: req.body.nombre,
        categoria: req.body.categoria,
        musculoPrincipal: req.body.musculoPrincipal,
        musculo: req.body.musculo,
        duracion: req.body.duracion,
        foto: req.body.foto,
        likes: req.body.likes,
        ejercicios: req.body.ejercicios,
        creador: req.body.creador,
        pedido: req.body.pedido,
        aprobado: req.body.aprobado,
        motivoRechazo: req.body.motivoRechazo,
        baja: req.body.baja,
        fechaBaja: req.body.fechaBaja
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

router.patch("/:id", verifyToken, async (req, res) => {
    try {
    const id = req.params.id;

    const resultado = await modelEntrenamientos.updateOne(
    { _id: id }, { $set: {
        nombre: req.body.nombre,
        categoria: req.body.categoria,
        musculoPrincipal: req.body.musculoPrincipal,
        musculo: req.body.musculo,
        duracion: req.body.duracion,
        foto: req.body.foto,
        likes: req.body.likes,
        ejercicios: req.body.ejercicios,
        creador: req.body.creador,
        pedido: req.body.pedido,
        aprobado: req.body.aprobado,
        motivoRechazo: req.body.motivoRechazo,
        baja: req.body.baja,
        fechaBaja: req.body.fechaBaja
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
        
        if (!id) {
            return res.status(400).json({ message: "ID del entrenamiento es requerido" });
        }

        // Verificar que el entrenamiento existe
        const entrenamiento = await modelEntrenamientos.findById(id);
        if (!entrenamiento) {
            return res.status(404).json({ message: "Entrenamiento no encontrado" });
        }

        console.log(`Iniciando eliminación recursiva del entrenamiento: ${id}`);

        // 1. Buscar todos los entrenamientos realizados asociados a este entrenamiento
        const entrenamientosRealizados = await modelEntrenamientoRealizado.find({ entrenamiento: id });
        console.log(`Encontrados ${entrenamientosRealizados.length} entrenamientos realizados`);

        // 2. Para cada entrenamiento realizado, eliminar sus ejercicios y series asociadas
        for (const entrenamientoRealizado of entrenamientosRealizados) {
            console.log(`Procesando entrenamiento realizado: ${entrenamientoRealizado._id}`);
            
            // Buscar ejercicios realizados de este entrenamiento realizado
            const ejerciciosRealizados = await modelEjercicioRealizado.find({ 
                entrenamientoRealizado: entrenamientoRealizado._id 
            });
            console.log(`Encontrados ${ejerciciosRealizados.length} ejercicios realizados`);

            // Para cada ejercicio realizado, eliminar sus series
            for (const ejercicioRealizado of ejerciciosRealizados) {
                console.log(`Procesando ejercicio realizado: ${ejercicioRealizado._id}`);
                
                // Eliminar todas las series de este ejercicio realizado
                const seriesEliminadas = await modelSerieRealizada.deleteMany({ 
                    ejercicioRealizado: ejercicioRealizado._id 
                });
                console.log(`Eliminadas ${seriesEliminadas.deletedCount} series realizadas`);

                // Eliminar el ejercicio realizado usando el método del documento para activar el pre hook
                await ejercicioRealizado.deleteOne();
            }

            // Eliminar el entrenamiento realizado usando el método del documento para activar el pre hook
            await entrenamientoRealizado.deleteOne();
        }

        // 3. Eliminar todos los guardados asociados a este entrenamiento
        const guardadosEliminados = await modelGuardados.deleteMany({ entrenamiento: id });
        console.log(`Eliminados ${guardadosEliminados.deletedCount} guardados`);

        // 4. Eliminar todos los likes asociados a este entrenamiento
        const likesEliminados = await modelLikes.deleteMany({ entrenamiento: id });
        console.log(`Eliminados ${likesEliminados.deletedCount} likes`);

        // 5. Finalmente, eliminar el entrenamiento principal usando el método del documento para activar el pre hook
        await entrenamiento.deleteOne();

        console.log(`Eliminación recursiva completada para el entrenamiento: ${id}`);

        res.status(200).json({ 
            message: `Entrenamiento ${id} y todos sus datos asociados han sido eliminados exitosamente`,
            detalles: {
                entrenamientosRealizados: entrenamientosRealizados.length,
                guardadosEliminados: guardadosEliminados.deletedCount,
                likesEliminados: likesEliminados.deletedCount
            }
        });

    } catch (error) {
        console.error('Error en eliminación recursiva:', error);
        res.status(500).json({ 
            message: "Error durante la eliminación recursiva", 
            error: error.message 
        });
    }
});


/*router.delete('/delete', verifyToken, async (req, res) => {
    try {
        const id = req.body._id;
        const data = await modelEntrenamientos.findById(id);
        if (data) {
            await data.deleteOne();
        } else {
            return res.status(404).json({ message: "Documento no encontrado" });
        }
        res.status(200).json({ message: `Document with ${id} has been deleted..` })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
})*/

router.post('/peticion', verifyToken, async (req, res) => {
    try {
        const id = req.body._id;
        const resultado = await modelEntrenamientos.updateOne(
            { _id: id },
            {$set: {
                pedido: true
                }
            });
        if (resultado.modifiedCount === 0) {
            res.status(404).json({ message: "Entrenamiento no encontrado" })
        }
        res.status(200).json({ message: "Petición del entrenamiento enviada" });
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})



module.exports = router;