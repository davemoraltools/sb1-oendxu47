import sgMail from '@sendgrid/mail';

export const handler = async (event) => {
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

  // Formatear los detalles del pedido en un texto legible
  const paellaSelectionsText = order.paellaSelections
    .map(
      (selection) =>
        `- ${selection.variety} (${selection.category}): ${selection.portions} porciones`
    )
    .join('\n');

  const paellaSelectionsHTML = order.paellaSelections
    .map(
      (selection) =>
        `<li>${selection.variety} (${selection.category}): ${selection.portions} porciones</li>`
    )
    .join('');

  const seafoodExtrasText = order.seafoodExtras.length
    ? order.seafoodExtras.join(', ')
    : 'Ninguno';

  const extrasText = order.extras.length ? order.extras.join(', ') : 'Ninguno';

  const commentsText = order.comments || 'Ninguno';

  const adminMessageText = `
Nuevo Pedido de Paella

Detalles del Cliente:
- Nombre: ${order.fullName}
- Email: ${order.email}
- Teléfono: ${order.phone}

Detalles del Evento:
- Fecha: ${order.date}
- Horario: ${order.timeSlot}
- Ciudad: ${order.city}
- Dirección: ${order.address}

Detalles del Pedido:
- Número de Invitados: ${order.guests}
- Paquete: ${order.package}
- Selección de Paellas:
${paellaSelectionsText}
- Extras de Mariscos: ${seafoodExtrasText}
- Extras Adicionales: ${extrasText}
- Presupuesto Personalizado: ${order.requestCustomQuote ? 'Sí' : 'No'}
- Comentarios: ${commentsText}
  `;

  const adminMessageHTML = `
    <h2 style="color: #333;">Nuevo Pedido de Paella</h2>

    <h3 style="color: #555;">Detalles del Cliente</h3>
    <ul>
      <li><strong>Nombre:</strong> ${order.fullName}</li>
      <li><strong>Email:</strong> ${order.email}</li>
      <li><strong>Teléfono:</strong> ${order.phone}</li>
    </ul>

    <h3 style="color: #555;">Detalles del Evento</h3>
    <ul>
      <li><strong>Fecha:</strong> ${order.date}</li>
      <li><strong>Horario:</strong> ${order.timeSlot}</li>
      <li><strong>Ciudad:</strong> ${order.city}</li>
      <li><strong>Dirección:</strong> ${order.address}</li>
    </ul>

    <h3 style="color: #555;">Detalles del Pedido</h3>
    <ul>
      <li><strong>Número de Invitados:</strong> ${order.guests}</li>
      <li><strong>Paquete:</strong> ${order.package}</li>
      <li><strong>Selección de Paellas:</strong>
        <ul>
          ${paellaSelectionsHTML}
        </ul>
      </li>
      <li><strong>Extras de Mariscos:</strong> ${seafoodExtrasText}</li>
      <li><strong>Extras Adicionales:</strong> ${extrasText}</li>
      <li><strong>Presupuesto Personalizado:</strong> ${
        order.requestCustomQuote ? 'Sí' : 'No'
      }</li>
      <li><strong>Comentarios:</strong> ${commentsText}</li>
    </ul>
  `;

  const msgToAdmin = {
    to: adminEmail,
    from: senderEmail,
    subject: 'Nuevo pedido de paella',
    text: adminMessageText,
    html: adminMessageHTML,
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