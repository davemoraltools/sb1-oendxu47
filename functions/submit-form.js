const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  console.log('Función submit-form ejecutada');
  console.log('Evento recibido:', event.body);

  let order;
  try {
    order = JSON.parse(event.body);
    console.log('Orden parseada:', order);
  } catch (parseError) {
    console.error('Error parseando el cuerpo de la solicitud:', parseError);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Cuerpo de la solicitud inválido' }),
    };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const senderEmail = process.env.SENDER_EMAIL;
  console.log('Admin Email:', adminEmail);
  console.log('Sender Email:', senderEmail);

  if (!adminEmail || !senderEmail || !process.env.SENDGRID_API_KEY) {
    console.error('Faltan variables de entorno');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Faltan variables de entorno' }),
    };
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msgToAdmin = {
    to: adminEmail,
    from: senderEmail,
    subject: 'Nuevo pedido de paella',
    text: `Detalles del pedido:\n\n${JSON.stringify(order, null, 2)}`,
  };

  const msgToClient = {
    to: order.email,
    from: senderEmail,
    subject: 'Confirmación de tu pedido',
    text: 'Gracias por tu pedido. Te contactaremos pronto para confirmar los detalles.',
  };

  try {
    await sgMail.send(msgToAdmin);
    console.log('Correo al administrador enviado');
    await sgMail.send(msgToClient);
    console.log('Correo al cliente enviado');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Correos enviados exitosamente' }),
    };
  } catch (error) {
    console.error('Error enviando correos:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};