const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  // Se asume que el token se envía en la cabecera Authorization con el formato: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: false
    });

    const currentTimeStamp = Math.floor(Date.now() / 1000);

    if (decoded.exp < currentTimeStamp) {
      console.log('Token expirado. Expiración:', new Date(decoded.exp * 1000).toISOString(), 
                  'Ahora:', new Date(currentTimestamp * 1000).toISOString());
      return res.status(401).json({ message: 'Token expirado' });
    }

    console.log('Token válido. Expira en:', new Date(decoded.exp * 1000).toISOString());
    req.user = decoded;
    next();

} catch (error) {
    console.error("Error al verificar el token:", error.name, error.message);
  
  if (error.name === 'TokenExpiredError') {

    return res.status(401).json({ message: 'Token expirado, inicie sesión nuevamente' });

  } else if (error.name === 'JsonWebTokenError') {

    return res.status(401).json({ message: 'Token inválido' });

  } else {

    return res.status(500).json({ message: 'Error de autenticación' });

  }
  }
}

module.exports = verifyToken;