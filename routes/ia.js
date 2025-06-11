const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Conversacion = require('../models/modelsConversacion');
const Mensaje = require('../models/modelsMensaje');
const Usuario = require('../models/modelsUsuarios');
const verifyToken = require('../middlewares/authMiddleware'); // Middleware para validar el JWT

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Obtener todas las conversaciones del usuario
router.get('/conversaciones/:id', verifyToken, async (req, res) => {
  try {
    const conversaciones = await Conversacion.find({ usuario: req.params.id })
      .sort({ updatedAt: -1 });
    res.status(200).json(conversaciones);
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
});

// Crear nueva conversación
router.post('/conversaciones', verifyToken, async (req, res) => {
  const { categoria, titulo } = req.body;
  try {
    const nuevaConversacion = new Conversacion({
      usuario: req.body.usuario,
      categoria,
      titulo: titulo || `Nueva conversación de ${categoria}`
    });

    const conver = await nuevaConversacion.save();
    res.status(200).json(conver);
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
});

// Obtener mensajes de una conversación
router.get('/conversaciones/:id/mensajes', verifyToken, async (req, res) => {
  try {
    const mensajes = await Mensaje.find({ conversacion: req.params.id })
      .sort({ timestamp: 1 });
    res.status(200).json(mensajes);
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
});

// Enviar mensaje y obtener respuesta
router.post('/conversaciones/:id/mensajes', verifyToken, async (req, res) => {
  const { contenido } = req.body;
  const conversacionId = req.params.id;
  
  try {
    // Verificar que la conversación existe y pertenece al usuario
    const conversacion = await Conversacion.findOne({ 
      _id: conversacionId,
      usuario: req.body.usuario
    });
    
    if (!conversacion) {
      return res.status(404).json({ msg: 'Conversación no encontrada' });
    }
    
    // Obtener datos del usuario para personalizar el prompt
    const usuario = await Usuario.findById(req.body.usuario);
    
    // Guardar mensaje del usuario
    const mensajeUsuario = new Mensaje({
      conversacion: conversacionId,
      contenido,
      esDeUsuario: true
    });
    const mensajeNuevo = await mensajeUsuario.save();
    
    // Obtener historial de la conversación para contexto
    const historialMensajes = await Mensaje.find({ conversacion: conversacionId })
      .sort({ timestamp: 1 })
      .limit(10);
    
    // Crear perfil del usuario para el prompt
    let perfilUsuario = `
      Nombre: ${usuario.nombre} ${usuario.apellido}
      Sexo: ${usuario.sexo || 'No especificado'}
      Edad: ${usuario.fechaNacimiento ? calcularEdad(usuario.fechaNacimiento) : 'No especificada'}
      Altura: ${usuario.altura ? `${usuario.altura} cm` : 'No especificada'}
      Peso actual: ${usuario.peso ? `${usuario.peso} kg` : 'No especificado'}
      IMC: ${usuario.IMC || 'No calculado'}
      Nivel de actividad: ${usuario.nivelActividad || 'No especificado'}
      Objetivo de peso: ${usuario.objetivoPeso ? `${usuario.objetivoPeso} kg` : 'No especificado'}
      Tiempo objetivo: ${usuario.objetivoTiempo ? `${usuario.objetivoTiempo} semanas` : 'No especificado'}
      Calorías de mantenimiento: ${usuario.caloriasMantenimiento || 'No calculadas'}
      Calorías objetivo: ${usuario.objetivoCalorias || 'No especificadas'}
    `;
    
    // Añadir contexto inicial según la categoría
    let promptSistema;
    switch(conversacion.categoria) {
      case 'nutricion':
        promptSistema = `Eres FitMind, un experto nutricionista que proporciona consejos personalizados sobre alimentación, dietas y nutrición. Estás hablando con ${usuario.nombre}, un usuario con el siguiente perfil:
        
        ${perfilUsuario}
        
        DIRECTRICES ESPECÍFICAS:
        - Si conoces su IMC (${usuario.IMC}), utilízalo para ajustar tus recomendaciones nutricionales.
        - Si conoces sus calorías de mantenimiento (${usuario.caloriasMantenimiento}) y objetivo (${usuario.objetivoCalorias}), usa estos valores para hacer recomendaciones precisas.
        - Si tiene un objetivo de peso (${usuario.objetivoPeso} kg) y tiempo (${usuario.objetivoTiempo} semanas), calcula un déficit/superávit calórico adecuado y seguro.
        - Adapta tus consejos a su nivel de actividad (${usuario.nivelActividad}).
        - Si falta información crucial, pregunta por ella de manera amigable.
        - Proporciona ejemplos de alimentos y comidas completas que se ajusten a sus necesidades.
        - Siempre prioriza un enfoque saludable y sostenible por encima de dietas extremas.
        
        Sé amigable, motivador y proporciona información precisa basada en ciencia nutricional actual. Mantén tus respuestas concisas, prácticas y personalizadas.`;
        break;
      case 'entrenamiento':
        promptSistema = `Eres FitMind, un entrenador personal experto que proporciona consejos personalizados sobre ejercicios y rutinas. Estás hablando con ${usuario.nombre}, un usuario con el siguiente perfil:
  
        ${perfilUsuario}
        
        DIRECTRICES ESPECÍFICAS:
        - Considera su IMC (${usuario.IMC}) para recomendar ejercicios apropiados para su composición corporal.
        - Adapta la intensidad según su nivel de actividad (${usuario.nivelActividad}).
        - Si tiene objetivo de peso (${usuario.objetivoPeso} kg), ajusta las recomendaciones de cardio vs. entrenamiento de fuerza.
        - Si es principiante, enfócate en técnica y progresión gradual.
        - Considera limitaciones potenciales basadas en su perfil (edad, peso, etc.).
        - Si falta información crucial, pregúntala de manera amigable.
        - Incluye ejercicios específicos con series, repeticiones y descansos cuando sea apropiado.
        - Recomienda frecuencia de entrenamiento adecuada según sus objetivos y nivel.
        
        Sé energético, motivador y proporciona instrucciones claras. Mantén tus respuestas concisas, prácticas y personalizadas para maximizar sus resultados de forma segura.`;
        break;
      case 'habitos':
        promptSistema = `Eres FitMind, un coach de hábitos saludables que proporciona consejos personalizados sobre rutinas diarias y mejoras del estilo de vida. Estás hablando con ${usuario.nombre}, un usuario con el siguiente perfil:
        
        ${perfilUsuario}
        
        DIRECTRICES ESPECÍFICAS:
        - Considera su nivel de actividad actual (${usuario.nivelActividad}) para recomendar cambios graduales y sostenibles.
        - Si tiene objetivos de peso (${usuario.objetivoPeso} kg) y tiempo (${usuario.objetivoTiempo} semanas), sugiere hábitos que apoyen estas metas.
        - Recomienda rutinas diarias específicas basadas en su perfil (mañana, tarde, noche).
        - Sugiere técnicas para establecer y mantener nuevos hábitos saludables.
        - Proporciona estrategias para superar obstáculos comunes según su perfil.
        - Si falta información crucial, pregúntala de manera amigable.
        - Sugiere hábitos relacionados con alimentación, ejercicio, sueño, estrés y bienestar mental.
        - Enfatiza la consistencia por encima de la perfección.
        
        Sé positivo, comprensivo y motivador. Mantén tus respuestas concisas, prácticas y personalizadas para ayudarle a crear un estilo de vida más saludable y sostenible.`;
        break;
      default:
        promptSistema = `Eres FitMind, un asistente que brinda consejos sobre salud, fitness y bienestar. Estás hablando con ${usuario.nombre}, un usuario con el siguiente perfil:
        
        ${perfilUsuario}
        
        Basándote en este perfil, proporciona consejos personalizados que se ajusten a sus características físicas, objetivos de peso y nivel de actividad. Si algunos datos no están especificados, puedes preguntar por ellos si son relevantes para tu respuesta. Sé amigable, útil y proporciona información basada en ciencia. Mantén tus respuestas concisas pero completas.`;
    }
    
    promptSistema = promptSistema + `\nEste es el mensaje de ${usuario.nombre} respondele como FitMind y recuerda que no debes responder a otras cosas que no tengan que ver con entrenamiento, nutricion o hábitos, en caso de que el usuario te pregunte sobre algo sea diferente de los temas de entrenamiento, nutrición o hábitos responde que no estás capacitado para responder a eso, también ajusta tu respuesta a un máximo de 500 tokens:\n`;
    // Preparar el historial de mensajes para Gemini
    // Primero añadimos la descripción del sistema al inicio para que Gemini tenga contexto
    let geminiHistory = [];

    // Añadimos los mensajes anteriores
    for (const msg of historialMensajes) {
      // Saltamos el mensaje actual del usuario ya que lo enviaremos como la consulta final
      if (msg._id === mensajeUsuario._id) continue;
      
      geminiHistory.push({
        role: msg.esDeUsuario ? "user" : "model",
        parts: [{ text: msg.contenido }]
      });
    }
    
    // Iniciar chat de Gemini con el historial
    const chat = model.startChat({
      history: geminiHistory.length > 0 ? geminiHistory: undefined,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });
    
    // Enviamos primero el contexto del sistema si es una conversación nueva
    /*if (historialMensajes.length <= 1) {
      await chat.sendMessage(promptSistema);
    }*/
    
    // Enviar el mensaje actual del usuario y obtener respuesta
    const result = await chat.sendMessage(promptSistema + contenido);
    const respuestaIA = result.response.text();
    
    // Guardar respuesta del asistente
    const mensajeIA = new Mensaje({
      conversacion: conversacionId,
      contenido: respuestaIA,
      esDeUsuario: false
    });
    await mensajeIA.save();
    
    // Actualizar timestamp de la conversación
    conversacion.updatedAt = Date.now();
    await conversacion.save();
    
    res.status(200).json({
      mensajeUsuario,
      mensajeIA
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error del servidor: ' + err.message);
  }
});

// Función auxiliar para calcular la edad a partir de la fecha de nacimiento
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}


router.patch('/conversaciones/:conversacionid', verifyToken, async (req, res) => {
  try {
    const id = req.params.conversacionid;
    if (!id) {
      return res.status(400).json({ message: "Falta el campo 'id'" });
    }

    // Se crea un objeto para almacenar solo los campos que se enviaron en el request
    const updateFields = {};

    if (req.body.titulo !== undefined) {
      updateFields.titulo = req.body.titulo;
    }

    // Si no se envía ningún campo para actualizar, se informa
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
    }
    // Se realiza la actualización solo de los campos proporcionados
    const resultado = await Conversacion.updateOne(
      { _id: id },
      { $set: updateFields }
    );

    if (resultado.modifiedCount === 0) {
      return res.status(404).json({ message: "Documento no encontrado o datos sin cambios" });
    }

    res.status(200).json({ message: "Documento actualizado exitosamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// DELETE: Elimina un usuario basado en el dni proporcionado (ruta protegida) - La uso para eliminar usuarios en WPF
router.delete('/conversaciones/:conversacionid', verifyToken, async (req, res) => {
    try {
        const id = req.params.conversacionid;
        if (!id) {
            return res.status(400).json({ message: "Falta el campo 'id'" });
        }
        const conver = await Conversacion.findById(id);
        if (conver) {
            await conver.deleteOne();
            const listaMensajes = await Mensaje.find({ conversacion: id });
            for (const mensaje of listaMensajes) {
                await mensaje.deleteOne();
            }
        } else {
            return res.status(404).json({ message: "Documento no encontrado" });
        }
        res.status(200).json({ message: `La conversacion ${id} se ha eliminado exitosamente` });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;