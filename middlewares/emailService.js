const nodemailer = require('nodemailer');

// Configuración del transportador de email
const transporter = nodemailer.createTransport({
    // Para Gmail
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Tu email
        pass: process.env.EMAIL_PASSWORD // Tu contraseña de aplicación
    }
    
    // Para otros proveedores, usar configuración SMTP:
    /*
    host: 'smtp.tu-proveedor.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
    */
});

// Función para enviar código de verificación
const sendVerificationCode = async (email, code) => {
    try {
        const mailOptions = {
            from: {
                name: 'FitSphere',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Código de verificación - FitSphere',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #7B1FA2; margin: 0;">FitSphere</h1>
                        <p style="color: #666; margin-top: 5px;">Tu aplicación de fitness</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                        <h2 style="color: #333; margin-bottom: 20px;">Código de Verificación</h2>
                        <p style="color: #666; margin-bottom: 25px;">
                            Has solicitado restablecer tu contraseña. Usa el siguiente código de verificación:
                        </p>
                        
                        <div style="background-color: #7B1FA2; color: white; font-size: 32px; font-weight: bold; 
                                    padding: 15px 30px; border-radius: 8px; letter-spacing: 3px; margin: 20px 0;">
                            ${code}
                        </div>
                        
                        <p style="color: #666; font-size: 14px; margin-top: 25px;">
                            Este código expira en 15 minutos por motivos de seguridad.
                        </p>
                        
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">
                            Si no solicitaste este cambio, puedes ignorar este email.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                        <p>© 2025 FitSphere. Todos los derechos reservados.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email enviado:', result.messageId);
        return true;
    } catch (error) {
        console.error('Error al enviar email:', error);
        return false;
    }
};

// Función para generar código aleatorio de 6 dígitos
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
    sendVerificationCode,
    generateVerificationCode
};