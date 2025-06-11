const express = require('express');
const bcrypt = require('bcryptjs');
const UsuariosSchema = require('../models/modelsUsuarios');
const verifyToken = require('../middlewares/authMiddleware'); // Middleware para validar el JWT
const router = express.Router();


// GET ALL: Obtiene todos los documentos de usuarios (ruta protegida) - La uso para cargar la lista de usuarios sin filtrar en WPF
router.get('/getAll', verifyToken, async (req, res) => {
    try {
        const data = await UsuariosSchema.find();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// POST NEW: Crea un nuevo usuario (ruta protegida) - La uso para crear nuevos usuarios en WPF
router.post('/new', verifyToken, async (req, res) => {
    try {
      // Hashear la contraseña antes de guardarla
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(req.body.contrasena, saltRounds);
  
      const data = new UsuariosSchema({
        email: req.body.email,
        contrasena: hashedPassword, // Guardar la contraseña cifrada
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        sexo: req.body.sexo,
        fechaNacimiento: req.body.fechaNacimiento,
        foto: req.body.foto,
      });
  
      const dataToSave = await data.save();
      res.status(200).json(dataToSave);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

// UPDATE: Actualiza un usuario basado en el dni proporcionado (ruta protegida) - La uso para modificar usuarios en WPF
router.patch('/update', verifyToken, async (req, res) => {
  try {
    const id = req.body._id;
    if (!id) {
      return res.status(400).json({ message: "Falta el campo 'id'" });
    }

    // Se crea un objeto para almacenar solo los campos que se enviaron en el request
    const updateFields = {};

    if (req.body.email !== undefined) {
      updateFields.email = req.body.email;
    }

    if (req.body.contrasena !== undefined) {
      let contrasena = req.body.contrasena;
      // Si la contraseña no está cifrada, se cifra
      if (!contrasena.startsWith('$2a$') && !contrasena.startsWith('$2b$')) {
        const saltRounds = 10;
        contrasena = await bcrypt.hash(contrasena, saltRounds);
      }
      updateFields.contrasena = contrasena;
    }

    // CAMPO FECHA - Convertir a Date
    if (req.body.fechaNacimiento !== undefined) {
      const fechaStr = req.body.fechaNacimiento;
      if (fechaStr.includes('/')) {
        const [dia, mes, ano] = fechaStr.split('/');
        updateFields.fechaNacimiento = new Date(`${ano}-${mes}-${dia}`);
      } else {
        updateFields.fechaNacimiento = new Date(fechaStr);
      }
    }

    if (req.body.nombre !== undefined) {
      updateFields.nombre = req.body.nombre;
    }

    if (req.body.apellido !== undefined) {
      updateFields.apellido = req.body.apellido;
    }

    if (req.body.foto !== undefined) {
      updateFields.foto = req.body.foto;
    }

    if (req.body.sexo !== undefined) {
      updateFields.sexo = req.body.sexo;
    }

    // CAMPOS NUMÉRICOS - Convertir a Number
    if (req.body.IMC !== undefined) {
      updateFields.IMC = Number(req.body.IMC);
    }

    if (req.body.nivelActividad !== undefined) {
      updateFields.nivelActividad = req.body.nivelActividad;
    }

    if (req.body.caloriasMantenimiento !== undefined) {
      updateFields.caloriasMantenimiento = Number(req.body.caloriasMantenimiento);
    }

    if (req.body.altura !== undefined) {
      updateFields.altura = Number(req.body.altura);
    }

    if (req.body.peso !== undefined) {
      updateFields.peso = Number(req.body.peso);
    }

    if (req.body.objetivoPeso !== undefined) {
      updateFields.objetivoPeso = Number(req.body.objetivoPeso);
    }

    if (req.body.objetivoTiempo !== undefined) {
      updateFields.objetivoTiempo = Number(req.body.objetivoTiempo);
    }

    if (req.body.objetivoCalorias !== undefined) {
      updateFields.objetivoCalorias = Number(req.body.objetivoCalorias);
    }

    if (req.body.entrenamientosFavoritos !== undefined) {
      updateFields.entrenamientosFavoritos = req.body.entrenamientosFavoritos;
    }

    if (req.body.plan !== undefined) {
      updateFields.plan = req.body.plan;
    }

    // CAMPO BOOLEAN - Convertir a Boolean
    if (req.body.formulario !== undefined) {
      updateFields.formulario = req.body.formulario === 'true' || req.body.formulario === true;
    }
    
    if (req.body.entrenamientosRealizados !== undefined) {
      updateFields.entrenamientosRealizados = req.body.entrenamientosRealizados;
    }
    
    // Si no se envía ningún campo para actualizar, se informa
    if (Object.keys(updateFields).length === 0) {
      console.log("No se proporcionaron campos para actualizar");
      return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
    }
        
    // Se realiza la actualización solo de los campos proporcionados
    const resultado = await UsuariosSchema.updateOne(
      { _id: id },
      { $set: updateFields }
    );
    
    if (resultado.modifiedCount === 0) {
      console.log("No se encontró el documento o no se realizaron cambios");
      return res.status(404).json({ message: "Documento no encontrado o datos sin cambios" });
    }

    res.status(200).json({ message: "Documento actualizado exitosamente" });
  } catch (error) {
    console.log("Error en update:", error);
    res.status(400).json({ message: error.message });
  }
});


// DELETE: Elimina un usuario basado en el dni proporcionado (ruta protegida) - La uso para eliminar usuarios en WPF
router.delete('/delete', verifyToken, async (req, res) => {
    try {
        const id = req.body._id;
        const usuario = await UsuariosSchema.findById(id);
        if (usuario) {
            await usuario.deleteOne();
        } else {
            return res.status(404).json({ message: "Documento no encontrado" });
        }
        res.status(200).json({ message: `El usuario ${id} se ha eliminado exitosamente` });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET ONE: Obtiene un usuario basado en email y contraseña (ruta protegida) - La uso para obtener todos los datos de un usuario despues de pasar el Login en WPF
router.post('/getOneEmail', verifyToken, async (req, res) => {
    try {
      const { email } = req.body; // Solo se utiliza el email
      const usuarioDB = await UsuariosSchema.findOne({ email });
      if (!usuarioDB) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }
      res.status(200).json(usuarioDB);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  
// GET FILTER: Filtra usuarios para la API del intermodular (ruta protegida) - La uso para filtrar usuarios en la lista de WPF
router.post('/getFilterInter', verifyToken, async (req, res) => {
    try {
        const condiciones = {};
        if (req.body.rol && req.body.rol.trim() !== "") {
            condiciones.rol = req.body.rol;
        }
        if (req.body.sexo && req.body.sexo.trim() !== "") {
            condiciones.sexo = req.body.sexo;
        }
        if (req.body.fechaNacimiento && req.body.fechaNacimiento.trim() !== "") {
            condiciones.fechaNacimiento = req.body.fechaNacimiento;
        }
        if (req.body.ciudad && req.body.ciudad.trim() !== "") {
            condiciones.ciudad = req.body.ciudad;
        }
        const data = await UsuariosSchema.find(condiciones);
        if (data.length === 0) {
            return res.status(404).json({ message: "Documento no encontrado" });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



/*registro para android*/
router.post('/register', async (req, res) => {
    try {
      const { email, contrasena } = req.body;
      
      // Verificar si ya existe un usuario con el mismo DNI o Email
      const existingUser = await UsuariosSchema.findOne({ email: email });
      
      if (existingUser) {
        return res.status(400).json({ message: "El usuario con ese DNI o Email ya existe" });
      }
      
      // Cifrar la contraseña antes de guardarla
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
      
      // Crear el usuario forzando el rol "cliente"
      const data = new UsuariosSchema({
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        email: req.body.email,
        contrasena: hashedPassword // Guardamos la contraseña cifrada
      });
      
      const dataToSave = await data.save();
      return res.status(200).json(dataToSave);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  });

// GET FILTER
router.post("/getFilter", verifyToken, async (req, res) => {
  try {
      const condiciones = {};

      if (req.body.nombre) condiciones.nombre = req.body.nombre;
      if (req.body.apellido) condiciones.apellido = req.body.apellido;
      if (req.body.email) condiciones.email = req.body.email;
      if (req.body.sexo) condiciones.sexo = req.body.sexo;
      if (req.body.plan) condiciones.plan = req.body.plan;

      const data = await UsuariosSchema.find(condiciones);
      if (data.length === 0) {
          return res.status(404).json({ message: "Documento no encontrado" });
      }

      res.status(200).json(data);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


router.get("/getOne/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await UsuariosSchema.findById(id);
    if (!data) {
      return res.status(404).json({ message: "Documento no encontrado" });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/verifyToken', verifyToken, (req, res) => {
  // Si llegamos aquí, el token es válido (el middleware verifyToken ya lo verificó)
  res.status(200).json({ valid: true, userId: req.user.userId });
});


// Agregar al router de usuarios existente
const VerificationCode = require('../models/modelsVerificationCode');
const { sendVerificationCode, generateVerificationCode } = require('../middlewares/emailService');

// Endpoint para enviar código de verificación
router.post('/send-verification-code', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email es requerido" });
        }

        // Verificar que el usuario existe
        const user = await UsuariosSchema.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No existe un usuario con ese email" });
        }

        // Eliminar código anterior si existe
        await VerificationCode.deleteOne({ email });

        // Generar nuevo código
        const code = generateVerificationCode();
        
        // Guardar código en la base de datos
        const verificationCode = new VerificationCode({
            email,
            code
        });
        
        await verificationCode.save();

        // Enviar email
        const emailSent = await sendVerificationCode(email, code);
        
        if (!emailSent) {
            await VerificationCode.deleteOne({ email });
            return res.status(500).json({ message: "Error al enviar el email" });
        }

        res.status(200).json({ message: "Código de verificación enviado" });
    } catch (error) {
        console.error('Error en send-verification-code:', error);
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para verificar código
router.post('/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({ message: "Email y código son requeridos" });
        }

        // Buscar código de verificación
        const verificationCode = await VerificationCode.findOne({ email });
        
        if (!verificationCode) {
            return res.status(404).json({ message: "Código no encontrado o expirado" });
        }

        // Verificar si ya se alcanzó el máximo de intentos
        if (verificationCode.attempts >= 3) {
            await VerificationCode.deleteOne({ email });
            return res.status(429).json({ message: "Máximo de intentos alcanzado. Solicita un nuevo código" });
        }

        // Verificar si el código ha expirado
        if (verificationCode.expiresAt < new Date()) {
            await VerificationCode.deleteOne({ email });
            return res.status(410).json({ message: "Código expirado. Solicita un nuevo código" });
        }

        // Verificar código
        if (verificationCode.code !== code) {
            // Incrementar intentos
            verificationCode.attempts += 1;
            await verificationCode.save();
            
            return res.status(400).json({ 
                message: `Código incorrecto. Intentos restantes: ${3 - verificationCode.attempts}` 
            });
        }

        // Código correcto - marcar como verificado
        verificationCode.verified = true;
        await verificationCode.save();

        res.status(200).json({ message: "Código verificado correctamente" });
    } catch (error) {
        console.error('Error en verify-code:', error);
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para cambiar contraseña
router.post('/change-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email y nueva contraseña son requeridos" });
        }

        // Verificar que existe un código verificado para este email
        const verificationCode = await VerificationCode.findOne({ 
            email, 
            verified: true 
        });
        
        if (!verificationCode) {
            return res.status(403).json({ message: "Código no verificado. Completa el proceso de verificación primero" });
        }

        // Verificar que el código no ha expirado (máximo 30 minutos desde la verificación)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        if (verificationCode.updatedAt < thirtyMinutesAgo) {
            await VerificationCode.deleteOne({ email });
            return res.status(410).json({ message: "Sesión de recuperación expirada. Inicia el proceso nuevamente" });
        }

        // Validar nueva contraseña
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
        }

        // Hashear nueva contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar contraseña del usuario
        const updateResult = await UsuariosSchema.updateOne(
            { email },
            { $set: { contrasena: hashedPassword } }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Eliminar código de verificación usado
        await VerificationCode.deleteOne({ email });

        res.status(200).json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
        console.error('Error en change-password:', error);
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para limpiar códigos expirados
router.delete('/cleanup-codes', async (req, res) => {
    try {
        const result = await VerificationCode.deleteMany({
            $or: [
                { expiresAt: { $lt: new Date() } },
                { attempts: { $gte: 3 } }
            ]
        });
        
        res.status(200).json({ 
            message: `Limpieza completada. ${result.deletedCount} códigos eliminados` 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
