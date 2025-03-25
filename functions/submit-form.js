import sgMail from '@sendgrid/mail';
import translations from '../src/locales/es.json';

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
    console.error('Faltan variables de entorno:', {
      adminEmail: !!adminEmail,
      senderEmail: !!senderEmail,
      sendgridApiKey: !!process.env.SENDGRID_API_KEY,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Faltan variables de entorno' }),
    };
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const getRange = (guests) => {
    if (guests >= 40) return '40+';
    if (guests >= 25) return '25+';
    if (guests >= 20) return '20-25';
    if (guests >= 16) return '16-20';
    return '10-15';
  };

  // Traducir el nombre del paquete
  const packageDisplay = translations.packs.packages[getRange(order.guests)]?.find((p) => p.id === order.package)?.name
    ? translations.packs.packages[getRange(order.guests)].find((p) => p.id === order.package).name
    : order.package || 'No especificado';

  const varietyNames = {
    calmars: translations.packs.paellaVarieties.fideua?.find((v) => v.id === 'calmars')?.name || 'Calamares',
    'mar-muntanya': translations.packs.paellaVarieties.seafood?.find((v) => v.id === 'mar-muntanya')?.name || 'Mar y Montaña',
    marisc: translations.packs.paellaVarieties.seafood?.find((v) => v.id === 'marisc')?.name || 'Paella de Mariscos',
    valenciana: translations.packs.paellaVarieties.meat?.find((v) => v.id === 'valenciana')?.name || 'Paella Valenciana',
    costella: translations.packs.paellaVarieties.meat?.find((v) => v.id === 'costella')?.name || 'Paella de Costilla',
    senyoret: translations.packs.paellaVarieties.seafood?.find((v) => v.id === 'senyoret')?.name || 'Paella del Senyoret',
    gandia: translations.packs.paellaVarieties.fideua?.find((v) => v.id === 'gandia')?.name || 'Fideuà de Gandia',
  };

  const categoryNames = {
    seafood: translations.labels.paellaCategories?.seafood || 'Mariscos',
    meat: translations.labels.paellaCategories?.meat || 'Carnes',
    verdures: translations.labels.paellaCategories?.verdures || 'Verduras',
    fideua: translations.labels.paellaCategories?.fideua || 'Fideuà',
  };

  const timeSlotNames = {
    midday: translations.labels?.midday || 'Mediodía',
    evening: translations.labels?.evening || 'Tarde',
  };

  const seafoodExtrasNames = {
    gambes: translations.packs.seafoodExtrasList?.find((e) => e.id === 'gambes')?.name || 'Gambas',
    musclos: translations.packs.seafoodExtrasList?.find((e) => e.id === 'musclos')?.name || 'Mejillones',
    bogavante: translations.packs.seafoodExtrasList?.find((e) => e.id === 'bogavante')?.name || 'Bogavante',
    carabinero: translations.packs.seafoodExtrasList?.find((e) => e.id === 'carabinero')?.name || 'Carabinero',
    'extra-marisco': translations.packs.seafoodExtrasList?.find((e) => e.id === 'extra-marisco')?.name || 'Extra de Marisco',
  };

  const extrasNames = {
    amanida: translations.packs.extrasList?.find((e) => e.id === 'amanida')?.name || 'Ensalada',
    pa: translations.packs.extrasList?.find((e) => e.id === 'pa')?.name || 'Pan',
    allioli: translations.packs.extrasList?.find((e) => e.id === 'allioli')?.name || 'Alioli',
    postres: translations.packs.extrasList?.find((e) => e.id === 'postres')?.name || 'Postres',
    sangria: translations.packs.extrasList?.find((e) => e.id === 'sangria')?.name || 'Sangría',
    iberics: translations.packs.extrasList?.find((e) => e.id === 'iberics')?.name || 'Ibéricos',
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No especificada';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ca-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formateando la fecha:', error);
      return dateStr;
    }
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number') {
      console.error('Precio no es un número:', price);
      return '0';
    }
    return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
  };

  const seafoodPortions = order.paellaSelections
    ? order.paellaSelections
        .filter((sel) => (sel.category === 'seafood' || sel.category === 'fideua') && parseInt(sel.portions) > 0)
        .reduce((sum, sel) => sum + parseInt(sel.portions), 0)
    : 0;

  // Validar priceDetails
  if (!order.priceDetails) {
    console.error('order.priceDetails no está definido:', order);
    order.priceDetails = {
      pricePerPerson: 0,
      seafoodSurchargePerPortion: 0,
      seafoodExtras: [],
      extras: [],
      totalPrice: 0,
    };
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333; text-align: center;">Nuevo Pedido Recibido</h2>
      <p style="color: #666; text-align: center;">A continuación, los detalles del pedido:</p>

      <h3 style="color: #333; margin-top: 20px;">Resumen del Pedido</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr>
          <td style="padding: 8px; color: #666;">Número de comensales:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${order.guests || 'No especificado'}</td>
        </tr>
        ${
          order.guests < 40
            ? `
        <tr>
          <td style="padding: 8px; color: #666;">Paquete seleccionado:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${packageDisplay}</td>
        </tr>
        `
            : ''
        }
        ${
          order.guests < 40 && order.paellaSelections
            ? `
        <tr>
          <td style="padding: 8px; color: #666;">Paellas:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">
            ${order.paellaSelections
              .filter((sel) => parseInt(sel.portions) > 0)
              .map(
                (sel) =>
                  `${varietyNames[sel.variety] || sel.variety || 'No especificado'} (${parseInt(sel.portions)} porciones)`
              )
              .join(', ') || 'Ninguna seleccionada'}
          </td>
        </tr>
        `
            : ''
        }
        ${
          order.guests < 40 && order.seafoodExtras?.length > 0
            ? `
        <tr>
          <td style="padding: 8px; color: #666;">Extras de mariscos:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">
            ${order.seafoodExtras.map((extraId) => seafoodExtrasNames[extraId] || extraId).join(', ') || 'Ninguno'}
            <br/><small style="color: #999;">(Para ${seafoodPortions} porciones de ${
              order.paellaSelections?.some((sel) => sel.category === 'seafood' && parseInt(sel.portions) > 0) &&
              order.paellaSelections?.some((sel) => sel.category === 'fideua' && parseInt(sel.portions) > 0)
                ? 'paellas de mariscos y fideuà'
                : order.paellaSelections?.some((sel) => sel.category === 'seafood' && parseInt(sel.portions) > 0)
                ? 'paellas de mariscos'
                : 'fideuà'
            })</small>
          </td>
        </tr>
        `
            : ''
        }
        ${
          order.guests < 40 && order.extras?.length > 0
            ? `
        <tr>
          <td style="padding: 8px; color: #666;">Extras adicionales:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">
            ${order.extras.map((extraId) => extrasNames[extraId] || extraId).join(', ') || 'Ninguno'}
          </td>
        </tr>
        `
            : ''
        }
        <tr>
          <td style="padding: 8px; color: #666;">Fecha:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${formatDate(order.date)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666;">Franja horaria:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${timeSlotNames[order.timeSlot] || order.timeSlot || 'No especificada'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666;">Ciudad:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${order.city || 'No especificada'}</td>
        </tr>
        ${
          order.address
            ? `
        <tr>
          <td style="padding: 8px; color: #666;">Dirección:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${order.address}</td>
        </tr>
        `
            : ''
        }
        ${
          order.comments
            ? `
        <tr>
          <td style="padding: 8px; color: #666;">Comentarios:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${order.comments}</td>
        </tr>
        `
            : ''
        }
      </table>

      ${
        !order.requestCustomQuote && order.guests < 40
          ? `
      <h3 style="color: #333; margin-top: 20px;">Desglose del Precio</h3>
      <div style="background-color: #fef9c3; padding: 15px; border-radius: 8px;">
        <h4 style="color: #333; font-size: 16px; margin-bottom: 10px;">Paellas</h4>
        ${
          order.paellaSelections
            ? order.paellaSelections
                .filter((sel) => parseInt(sel.portions) > 0)
                .map((sel) => {
                  const portions = parseInt(sel.portions);
                  const basePrice = order.priceDetails.pricePerPerson * portions;
                  const surcharge = (sel.category === 'seafood' || sel.category === 'fideua') ? order.priceDetails.seafoodSurchargePerPortion * portions : 0;
                  return `
                    <div style="margin-bottom: 10px;">
                      <div style="display: flex; justify-content: space-between; color: #666;">
                        <span>${varietyNames[sel.variety] || sel.variety || 'No especificado'} (${portions} porciones)</span>
                        <span>${formatPrice(basePrice)}€</span>
                      </div>
                      ${
                        surcharge > 0
                          ? `
                      <div style="display: flex; justify-content: space-between; color: #999; font-size: 14px;">
                        <span>Recargo por ${sel.category === 'seafood' ? 'mariscos' : 'fideuà'} (${formatPrice(order.priceDetails.seafoodSurchargePerPortion)}€ × ${portions})</span>
                        <span>${formatPrice(surcharge)}€</span>
                      </div>
                      `
                          : ''
                      }
                    </div>
                  `;
                })
                .join('')
            : '<p>No hay paellas seleccionadas</p>'
        }

        ${
          order.seafoodExtras?.length > 0
            ? `
        <h4 style="color: #333; font-size: 16px; margin-top: 15px; margin-bottom: 10px;">Extras de Mariscos</h4>
        ${order.seafoodExtras
          .map((extraId) => {
            const extra = order.priceDetails.seafoodExtras?.find((e) => e.id === extraId);
            if (!extra) {
              console.warn(`Extra de mariscos no encontrado: ${extraId}`);
              return '';
            }
            const extraTotal = extra.price * seafoodPortions;
            return `
              <div style="display: flex; justify-content: space-between; color: #666; margin-bottom: 5px;">
                <span>${seafoodExtrasNames[extraId] || extraId} (${formatPrice(extra.price)}€ × ${seafoodPortions} porciones)</span>
                <span>${formatPrice(extraTotal)}€</span>
              </div>
            `;
          })
          .join('')}
        `
            : ''
        }

        ${
          order.extras?.length > 0
            ? `
        <h4 style="color: #333; font-size: 16px; margin-top: 15px; margin-bottom: 10px;">Extras Adicionales</h4>
        ${order.extras
          .map((extraId) => {
            const extra = order.priceDetails.extras?.find((e) => e.id === extraId);
            if (!extra) {
              console.warn(`Extra adicional no encontrado: ${extraId}`);
              return '';
            }
            const extraTotal = extra.price * order.guests;
            return `
              <div style="display: flex; justify-content: space-between; color: #666; margin-bottom: 5px;">
                <span>${extrasNames[extraId] || extraId} (${formatPrice(extra.price)}€ × ${order.guests} comensales)</span>
                <span>${formatPrice(extraTotal)}€</span>
              </div>
            `;
          })
          .join('')}
        `
            : ''
        }

        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 15px; color: #333;">
          <span>Total:</span>
          <span style="color: #d97706;">${formatPrice(order.priceDetails.totalPrice)}€</span>
        </div>
      </div>
      `
          : ''
      }

      <h3 style="color: #333; margin-top: 20px;">Información del Cliente</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr>
          <td style="padding: 8px; color: #666;">Nombre completo:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${order.fullName || 'No especificado'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666;">Correo electrónico:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${order.email || 'No especificado'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666;">Teléfono:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${order.phone || 'No especificado'}</td>
        </tr>
      </table>
    </div>
  `;

  const textContent = `
Nuevo Pedido Recibido

Resumen del Pedido:
- Número de comensales: ${order.guests || 'No especificado'}
${
  order.guests < 40
    ? `
- Paquete seleccionado: ${packageDisplay}
- Paellas: ${
      order.paellaSelections
        ? order.paellaSelections
            .filter((sel) => parseInt(sel.portions) > 0)
            .map((sel) => `${varietyNames[sel.variety] || sel.variety || 'No especificado'} (${parseInt(sel.portions)} porciones)`)
            .join(', ')
        : 'Ninguna seleccionada'
    }
${
  order.seafoodExtras?.length > 0
    ? `
- Extras de mariscos: ${order.seafoodExtras.map((extraId) => seafoodExtrasNames[extraId] || extraId).join(', ') || 'Ninguno'} (Para ${seafoodPortions} porciones de ${
        order.paellaSelections?.some((sel) => sel.category === 'seafood' && parseInt(sel.portions) > 0) &&
        order.paellaSelections?.some((sel) => sel.category === 'fideua' && parseInt(sel.portions) > 0)
          ? 'paellas de mariscos y fideuà'
          : order.paellaSelections?.some((sel) => sel.category === 'seafood' && parseInt(sel.portions) > 0)
          ? 'paellas de mariscos'
          : 'fideuà'
      })`
    : ''
}
${
  order.extras?.length > 0
    ? `
- Extras adicionales: ${order.extras.map((extraId) => extrasNames[extraId] || extraId).join(', ') || 'Ninguno'}`
    : ''
}
`
    : ''
}
- Fecha: ${formatDate(order.date)}
- Franja horaria: ${timeSlotNames[order.timeSlot] || order.timeSlot || 'No especificada'}
- Ciudad: ${order.city || 'No especificada'}
${order.address ? `- Dirección: ${order.address}` : ''}
${order.comments ? `- Comentarios: ${order.comments}` : ''}

${
  !order.requestCustomQuote && order.guests < 40
    ? `
Desglose del Precio:
Paellas:
${
  order.paellaSelections
    ? order.paellaSelections
        .filter((sel) => parseInt(sel.portions) > 0)
        .map((sel) => {
          const portions = parseInt(sel.portions);
          const basePrice = order.priceDetails.pricePerPerson * portions;
          const surcharge = (sel.category === 'seafood' || sel.category === 'fideua') ? order.priceDetails.seafoodSurchargePerPortion * portions : 0;
          return `- ${varietyNames[sel.variety] || sel.variety || 'No especificado'} (${portions} porciones): ${formatPrice(basePrice)}€${
            surcharge > 0
              ? `\n  Recargo por ${sel.category === 'seafood' ? 'mariscos' : 'fideuà'} (${formatPrice(order.priceDetails.seafoodSurchargePerPortion)}€ × ${portions}): ${formatPrice(surcharge)}€`
              : ''
          }`;
        })
        .join('\n')
    : 'No hay paellas seleccionadas'
}
${
  order.seafoodExtras?.length > 0
    ? `
Extras de Mariscos:
${order.seafoodExtras
  .map((extraId) => {
    const extra = order.priceDetails.seafoodExtras?.find((e) => e.id === extraId);
    if (!extra) return '';
    const extraTotal = extra.price * seafoodPortions;
    return `- ${seafoodExtrasNames[extraId] || extraId} (${formatPrice(extra.price)}€ × ${seafoodPortions} porciones): ${formatPrice(extraTotal)}€`;
  })
  .join('\n')}
`
    : ''
}
${
  order.extras?.length > 0
    ? `
Extras Adicionales:
${order.extras
  .map((extraId) => {
    const extra = order.priceDetails.extras?.find((e) => e.id === extraId);
    if (!extra) return '';
    const extraTotal = extra.price * order.guests;
    return `- ${extrasNames[extraId] || extraId} (${formatPrice(extra.price)}€ × ${order.guests} comensales): ${formatPrice(extraTotal)}€`;
  })
  .join('\n')}
`
    : ''
}
Total: ${formatPrice(order.priceDetails.totalPrice)}€
`
    : ''
}

Información del Cliente:
- Nombre completo: ${order.fullName || 'No especificado'}
- Correo electrónico: ${order.email || 'No especificado'}
- Teléfono: ${order.phone || 'No especificado'}
  `;

  const msg = {
    to: adminEmail,
    from: senderEmail,
    subject: `Nuevo Pedido de ${order.fullName || 'Cliente'}`,
    text: textContent,
    html: htmlContent,
  };

  try {
    console.log('Intentando enviar correo con SendGrid...');
    const sendResult = await sgMail.send(msg);
    console.log('Correo enviado exitosamente:', sendResult);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Formulario enviado exitosamente' }),
    };
  } catch (error) {
    console.error('Error enviando el correo:', error);
    if (error.response) {
      console.error('Detalles del error de SendGrid:', error.response.body);
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error enviando el formulario', details: error.message }),
    };
  }
};