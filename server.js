require('dotenv').config(); // Carga las variables de entorno

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const verifyToken = require('./middlewares/authMiddleware');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


// Conexión a la base de datos
const mongoString = process.env.DATABASE_URL;
mongoose.connect(mongoString);

const database = mongoose.connection;
database.on('error', (error) => {
    console.log(error);
});
database.once('connected', () => {
    console.log('Database Connected');
});

// Rutas
const routerUsuarios = require('./routes/routerUsuarios');   // Rutas de usuarios
const routerEjercicios = require('./routes/routerEjercicios');   // Rutas de ejercicios
const routerEntrenamientoRealizado = require('./routes/routerEntrenamientoRealizado');   // Rutas de entrenar
const routerEntrenamientos = require('./routes/routerEntrenamientos');   // Rutas de entrenamientos
const routerEjercicioRealizado = require('./routes/routerEjercicioRealizado');   // Rutas de ejercicio realizado
const authRouter = require('./routes/auth');   // Rutas de autenticación
const routerEventos = require('./routes/routerEventos');   // Rutas de eventos
const routerEventosUsuario = require('./routes/routerEventosUsuario');   // Rutas de eventos del usuario
const routerSerieRealizada = require('./routes/routerSerieRealizada');   // Rutas de serie realizada
const routerLikes = require('./routes/routerLikes');   // Rutas de likes
const routerGuardados = require('./routes/routerGuardados');   // Rutas de entrenamiento guardado
const routerIA = require('./routes/ia');   // Rutas de IA
const routerMediciones = require('./routes/routerMediciones');   // Rutas de mediciones

// Empleos
app.use('/usuarios', routerUsuarios);
app.use('/ejercicios', routerEjercicios);
app.use('/entrenamientoRealizado', routerEntrenamientoRealizado);
app.use('/entrenamientos', routerEntrenamientos);
app.use('/ejercicioRealizado', routerEjercicioRealizado);
app.use('/auth', authRouter);
app.use('/eventos', routerEventos);
app.use('/eventosUsuario', routerEventosUsuario);
app.use('/serieRealizada', routerSerieRealizada);
app.use('/likes', routerLikes)
app.use('/guardados', routerGuardados);
app.use('/ia', routerIA);
app.use('/mediciones', routerMediciones);

// Define el puerto y arranca el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
});