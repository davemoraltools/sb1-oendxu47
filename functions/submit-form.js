import sgMail from '@sendgrid/mail';
import translations from '../src/locales/es.json'; // Importar es.json

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

  // Traducir valores usando es.json
  const packageDisplay = translations.packs[order.package] || order.package;

  const varietyNames = {
    calmars: translations.calmars || 'Calamares', // Si "calmars" no está en es.json, usamos un valor por defecto
    marisc: translations.marisc || 'Paella de Mariscos',
    valenciana: translations.valenciana || 'Paella Valenciana',
    costella: translations.costella || 'Paella de Costilla',
    senyoret: translations.senyoret || 'Paella del Senyoret',
  };

  const categoryNames = {
    seafood: translations.seafood || 'Mariscos',
  };

  const timeSlots = {
    midday: translations.midday || 'Mediodía',
    evening: translations.evening || 'Tarde',
  };

  const seafoodExtrasNames = {
    bogavante: translations.bogavante || 'Bogavante',
    carabinero: translations.carabinero || 'Carabinero',
    'extra-marisco': translations['extra-marisco'] || 'Extra de Mariscos',
  };

  const extrasNames = {
    sangria: translations.sangria || 'Sangría',
    iberics: translations.iberics || 'Ibéricos',
  };

  const timeSlotDisplay = timeSlots[order.timeSlot] || order.timeSlot;

  // Formatear los detalles del pedido en un texto legible
  const paellaSelectionsText = order.paellaSelections
    .map(
      (selection) =>
        `- ${
          varietyNames[selection.variety] || selection.variety
        } (${
          categoryNames[selection.category] || selection.category
        }): ${selection.portions} porciones`
    )
    .join('\n');

  const paellaSelectionsHTML = order.paellaSelections
    .map(
      (selection) =>
        `<li>${
          varietyNames[selection.variety] || selection.variety
        } (${
          categoryNames[selection.category] || selection.category
        }): ${selection.portions} porciones</li>`
    )
    .join('');

  const seafoodExtrasText = order.seafoodExtras.length
    ? order.seafoodExtras
        .map((extra) => seafoodExtrasNames[extra] || extra)
        .join(', ')
    : translations.none || 'Ninguno';

  const extrasText = order.extras.length
    ? order.extras.map((extra) => extrasNames[extra] || extra).join(', ')
    : translations.none || 'Ninguno';

  const commentsText = order.comments || (translations.none || 'Ninguno');

  const adminMessageText = `
Nuevo Pedido de Paella

Detalles del Cliente:
- Nombre: ${order.fullName}
- Email: ${order.email}
- Teléfono: ${order.phone}

Detalles del Evento:
- Fecha: ${order.date}
- Horario: ${timeSlotDisplay}
- Ciudad: ${order.city}
- Dirección: ${order.address}

Detalles del Pedido:
- Número de Invitados: ${order.guests}
- Paquete: ${packageDisplay}
- Selección de Paellas:
${paellaSelectionsText}
- Extras de Mariscos: ${seafoodExtrasText}
- Extras Adicionales: ${extrasText}
- Presupuesto Personalizado: ${order.requestCustomQuote ? 'Sí' : 'No'}
- Comentarios: ${commentsText}
  `;

  const adminMessageHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Nuevo Pedido de Paella</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        h2 { color: #d9534f; }
        h3 { color: #555; }
        ul { list-style-type: none; padding-left: 0; }
        li { margin-bottom: 5px; }
        .section { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h2>Nuevo Pedido de Paella</h2>

      <div class="section">
        <h3>Detalles del Cliente</h3>
        <ul>
          <li><strong>Nombre:</strong> ${order.fullName}</li>
          <li><strong>Email:</strong> ${order.email}</li>
          <li><strong>Teléfono:</strong> ${order.phone}</li>
        </ul>
      </div>

      <div class="section">
        <h3>Detalles del Evento</h3>
        <ul>
          <li><strong>Fecha:</strong> ${order.date}</li>
          <li><strong>Horario:</strong> ${timeSlotDisplay}</li>
          <li><strong>Ciudad:</strong> ${order.city}</li>
          <li><strong>Dirección:</strong> ${order.address}</li>
        </ul>
      </div>

      <div class="section">
        <h3>Detalles del Pedido</h3>
        <ul>
          <li><strong>Número de Invitados:</strong> ${order.guests}</li>
          <li><strong>Paquete:</strong> ${packageDisplay}</li>
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
      </div>
    </body>
    </html>
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