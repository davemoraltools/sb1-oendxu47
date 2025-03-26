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

  // Función para generar el número de pedido en formato AAMMDD
  const getOrderNumber = (dateStr) => {
    if (!dateStr) return '000000'; // Valor por defecto si no hay fecha
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear().toString().slice(-2); // Últimas 2 cifras del año
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes con 2 dígitos
      const day = String(date.getDate()).padStart(2, '0'); // Día con 2 dígitos
      return `${year}${month}${day}`; // Ejemplo: 2025-03-27 → 250327
    } catch (error) {
      console.error('Error generando el número de pedido:', error);
      return '000000';
    }
  };

  const orderNumber = getOrderNumber(order.date); // Generar el número de pedido

  // Mapear los IDs de los paquetes a sus nombres traducidos
  const packageNames = {
    embajador: translations.packs.embajador || 'Pack Embajador',
    'embajador-show': translations.packs['embajador-show'] || 'Pack Embajador con Show',
    amanida: translations.packs.amanida || 'Pack Ensalada',
    'amanida-show': translations.packs['amanida-show'] || 'Pack Ensalada con Show',
    'pica-pica': translations.packs['pica-pica'] || 'Pack Pica Pica',
    'pica-pica-show': translations.packs['pica-pica-show'] || 'Pack Pica Pica con Show',
    'només-paella': translations.packs['només-paella'] || 'Pack Solo Paella',
    'paella-show': translations.packs['paella-show'] || 'Pack Paella con Show'
  };

  const packageDisplay = packageNames[order.package] || order.package || 'No especificado';

  // Mapear todas las variedades de paellas a sus nombres traducidos
  const varietyNames = {
    // Carne (packs.meat)
    valenciana: translations.packs.meat?.valenciana || 'Paella Valenciana',
    hivern: translations.packs.meat?.hivern || 'Paella Valenciana de Invierno',
    senyoret: translations.packs.meat?.senyoret || 'Paella de Senyoret',
    costella: translations.packs.meat?.costella || 'Paella de Costilla',
    // Mariscos (packs.seafood)
    'mar-muntanya': translations.packs.seafood?.['mar-muntanya'] || 'Paella de Mar y Montaña',
    marisc: translations.packs.seafood?.marisc || 'Paella de Marisco',
    'senyoret-peix': translations.packs.seafood?.['senyoret-peix'] || 'Paella de Senyoret de Pescado',
    negre: translations.packs.seafood?.negre || 'Arroz Negro',
    calamars: translations.packs.seafood?.calamars || 'Paella de Calamares y Alcachofa',
    'bacalla-cebolla': translations.packs.seafood?.['bacalla-cebolla'] || 'Paella de Bacalao y Cebolla',
    // Verduras (packs.verdures)
    verdures: translations.packs.verdures?.verdures || 'Paella de Verduras',
    'verdures-bolets': translations.packs.verdures?.['verdures-bolets'] || 'Paella de Verduras y Setas',
    // Fideuà (packs.fideua)
    gandia: translations.packs.fideua?.gandia || 'Fideuà de Gandía'
  };

  const categoryNames = {
    seafood: translations.labels.paellaCategories?.seafood || 'Mariscos',
    meat: translations.labels.paellaCategories?.meat || 'Carnes',
    verdures: translations.labels.paellaCategories?.verdures || 'Verduras',
    fideua: translations.labels.paellaCategories?.fideua || 'Fideuà'
  };

  const timeSlotNames = {
    midday: translations.labels?.midday || 'Mediodía',
    evening: translations.labels?.evening || 'Tarde-Noche'
  };

  // Mapear los extras de mariscos a sus nombres traducidos
  const seafoodExtrasNames = {
    gambes: translations.packs.seafoodExtras?.gambes || 'Gambas',
    musclos: translations.packs.seafoodExtras?.musclos || 'Mejillones',
    bogavante: translations.packs.seafoodExtras?.bogavante || 'Bogavante',
    carabinero: translations.packs.seafoodExtras?.carabinero || 'Carabinero',
    'extra-marisco': translations.packs.seafoodExtras?.['extra-marisco'] || 'Extra de Marisco'
  };

  // Mapear los extras adicionales a sus nombres traducidos
  const extrasNames = {
    amanida: translations.packs.extras?.amanida || 'Ensalada',
    pa: translations.packs.extras?.pa || 'Pan',
    allioli: translations.packs.extras?.allioli || 'Alioli',
    postres: translations.packs.extras?.postres || 'Postres',
    sangria: translations.packs.extras?.sangria || 'Extra de Sangría',
    iberics: translations.packs.extras?.iberics || 'Extra de Ibéricos'
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

  // Determinar el tipo de paellas para los extras de mariscos
  const hasSeafood = order.paellaSelections?.some((sel) => sel.category === 'seafood' && parseInt(sel.portions) > 0);
  const hasFideua = order.paellaSelections?.some((sel) => sel.category === 'fideua' && parseInt(sel.portions) > 0);
  const seafoodExtrasType = hasSeafood && hasFideua ? 'paellas de mariscos y fideuà' : hasSeafood ? 'paellas de mariscos' : 'fideuà';

  // Contenido del correo para el administrador (HTML)
  const htmlContentAdmin = `
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
            <br/><small style="color: #999;">(Para ${seafoodPortions} porciones de ${seafoodExtrasType})</small>
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
      <div style="padding: 15px; border-radius: 8px;">
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
        <div style="text-align: right; color: #999; font-size: 14px; margin-top: 5px;">
          <span>IVA incluido</span>
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

  // Contenido del correo para el administrador (Texto plano con Markdown para Trello)
  const textContentAdmin = `
# Resumen del Pedido

- **Número de comensales:** ${order.guests || 'No especificado'}
${
  order.guests < 40
    ? `
- **Paquete seleccionado:** ${packageDisplay}
- **Paellas:**  
  ${
    order.paellaSelections
      ? order.paellaSelections
          .filter((sel) => parseInt(sel.portions) > 0)
          .map((sel) => `- ${varietyNames[sel.variety] || sel.variety || 'No especificado'} (${parseInt(sel.portions)} porciones)`)
          .join('\n  ')
      : 'Ninguna seleccionada'
  }
${
  order.seafoodExtras?.length > 0
    ? `
- **Extras de mariscos:** ${order.seafoodExtras.map((extraId) => seafoodExtrasNames[extraId] || extraId).join(', ') || 'Ninguno'} *(Para ${seafoodPortions} porciones de ${seafoodExtrasType})*`
    : ''
}
${
  order.extras?.length > 0
    ? `
- **Extras adicionales:** ${order.extras.map((extraId) => extrasNames[extraId] || extraId).join(', ') || 'Ninguno'}`
    : ''
}
`
    : ''
}
- **Fecha:** ${formatDate(order.date)}
- **Franja horaria:** ${timeSlotNames[order.timeSlot] || order.timeSlot || 'No especificada'}
- **Ciudad:** ${order.city || 'No especificada'}
${order.address ? `- **Dirección:** ${order.address}` : ''}
${order.comments ? `- **Comentarios:** ${order.comments}` : ''}

${
  !order.requestCustomQuote && order.guests < 40
    ? `
## Desglose del Precio

### Paellas
${
  order.paellaSelections
    ? order.paellaSelections
        .filter((sel) => parseInt(sel.portions) > 0)
        .map((sel) => {
          const portions = parseInt(sel.portions);
          const basePrice = order.priceDetails.pricePerPerson * portions;
          const surcharge = (sel.category === 'seafood' || sel.category === 'fideua') ? order.priceDetails.seafoodSurchargePerPortion * portions : 0;
          return `- **${varietyNames[sel.variety] || sel.variety || 'No especificado'}** (${portions} porciones): ${formatPrice(basePrice)}€${
            surcharge > 0
              ? `\n  - Recargo por ${sel.category === 'seafood' ? 'mariscos' : 'fideuà'} (${formatPrice(order.priceDetails.seafoodSurchargePerPortion)}€ × ${portions}): ${formatPrice(surcharge)}€`
              : ''
          }`;
        })
        .join('\n')
    : 'No hay paellas seleccionadas'
}
${
  order.seafoodExtras?.length > 0
    ? `
### Extras de Mariscos
${order.seafoodExtras
  .map((extraId) => {
    const extra = order.priceDetails.seafoodExtras?.find((e) => e.id === extraId);
    if (!extra) return '';
    const extraTotal = extra.price * seafoodPortions;
    return `- **${seafoodExtrasNames[extraId] || extraId}** (${formatPrice(extra.price)}€ × ${seafoodPortions} porciones): ${formatPrice(extraTotal)}€`;
  })
  .join('\n')}
`
    : ''
}
${
  order.extras?.length > 0
    ? `
### Extras Adicionales
${order.extras
  .map((extraId) => {
    const extra = order.priceDetails.extras?.find((e) => e.id === extraId);
    if (!extra) return '';
    const extraTotal = extra.price * order.guests;
    return `- **${extrasNames[extraId] || extraId}** (${formatPrice(extra.price)}€ × ${order.guests} comensales): ${formatPrice(extraTotal)}€`;
  })
  .join('\n')}
`
    : ''
}
**Total:** ${formatPrice(order.priceDetails.totalPrice)}€ *(IVA incluido)*
`
    : ''
}

## Información del Cliente

- **Nombre completo:** ${order.fullName || 'No especificado'}
- **Correo electrónico:** ${order.email || 'No especificado'}
- **Teléfono:** ${order.phone || 'No especificado'}
  `;

  // Contenido del correo para el cliente (HTML con desglose mejorado)
  const htmlContentClient = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333; text-align: center;">¡Gracias por tu pedido, ${order.fullName || 'Cliente'}!</h2>
      <p style="color: #666; text-align: center;">Hemos recibido tu pedido con éxito. A continuación, te mostramos un resumen de tu solicitud. Nos pondremos en contacto contigo pronto para confirmar los detalles.</p>

      <h3 style="color: #333; margin-top: 20px;">Resumen de tu Pedido</h3>
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
            <br/><small style="color: #999;">(Para ${seafoodPortions} porciones de ${seafoodExtrasType})</small>
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
      <div style="padding: 15px; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td colspan="2" style="color: #333; font-size: 16px; font-weight: bold; padding-bottom: 5px;">Paellas</td>
          </tr>
          <tr>
            <td colspan="2" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;"></td>
          </tr>
          ${
            order.paellaSelections
              ? order.paellaSelections
                  .filter((sel) => parseInt(sel.portions) > 0)
                  .map((sel) => {
                    const portions = parseInt(sel.portions);
                    const basePrice = order.priceDetails.pricePerPerson * portions;
                    const surcharge = (sel.category === 'seafood' || sel.category === 'fideua') ? order.priceDetails.seafoodSurchargePerPortion * portions : 0;
                    return `
                      <tr>
                        <td style="padding: 5px 0; color: #666;">${varietyNames[sel.variety] || sel.variety || 'No especificado'} (${portions} porciones)</td>
                        <td style="padding: 5px 0; color: #666; text-align: right;">${formatPrice(basePrice)}€</td>
                      </tr>
                      ${
                        surcharge > 0
                          ? `
                      <tr>
                        <td style="padding: 5px 0; color: #999; font-size: 14px;">Recargo por ${sel.category === 'seafood' ? 'mariscos' : 'fideuà'} (${formatPrice(order.priceDetails.seafoodSurchargePerPortion)}€ × ${portions})</td>
                        <td style="padding: 5px 0; color: #999; font-size: 14px; text-align: right;">${formatPrice(surcharge)}€</td>
                      </tr>
                      `
                          : ''
                      }
                    `;
                  })
                  .join('')
              : '<tr><td colspan="2" style="color: #666;">No hay paellas seleccionadas</td></tr>'
          }

          ${
            order.seafoodExtras?.length > 0
              ? `
          <tr>
            <td colspan="2" style="padding-top: 15px;"></td>
          </tr>
          <tr>
            <td colspan="2" style="color: #333; font-size: 16px; font-weight: bold; padding-bottom: 5px;">Extras de Mariscos</td>
          </tr>
          <tr>
            <td colspan="2" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;"></td>
          </tr>
          ${order.seafoodExtras
            .map((extraId) => {
              const extra = order.priceDetails.seafoodExtras?.find((e) => e.id === extraId);
              if (!extra) {
                console.warn(`Extra de mariscos no encontrado: ${extraId}`);
                return '';
              }
              const extraTotal = extra.price * seafoodPortions;
              return `
                <tr>
                  <td style="padding: 5px 0; color: #666;">${seafoodExtrasNames[extraId] || extraId} (${formatPrice(extra.price)}€ × ${seafoodPortions} porciones)</td>
                  <td style="padding: 5px 0; color: #666; text-align: right;">${formatPrice(extraTotal)}€</td>
                </tr>
              `;
            })
            .join('')}
          `
              : ''
          }

          ${
            order.extras?.length > 0
              ? `
          <tr>
            <td colspan="2" style="padding-top: 15px;"></td>
          </tr>
          <tr>
            <td colspan="2" style="color: #333; font-size: 16px; font-weight: bold; padding-bottom: 5px;">Extras Adicionales</td>
          </tr>
          <tr>
            <td colspan="2" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;"></td>
          </tr>
          ${order.extras
            .map((extraId) => {
              const extra = order.priceDetails.extras?.find((e) => e.id === extraId);
              if (!extra) {
                console.warn(`Extra adicional no encontrado: ${extraId}`);
                return '';
              }
              const extraTotal = extra.price * order.guests;
              return `
                <tr>
                  <td style="padding: 5px 0; color: #666;">${extrasNames[extraId] || extraId} (${formatPrice(extra.price)}€ × ${order.guests} comensales)</td>
                  <td style="padding: 5px 0; color: #666; text-align: right;">${formatPrice(extraTotal)}€</td>
                </tr>
              `;
            })
            .join('')}
          `
              : ''
          }

          <tr>
            <td colspan="2" style="border-top: 1px solid #e0e0e0; padding-top: 10px; margin-top: 15px;"></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-size: 18px; font-weight: bold; color: #333;">Total:</td>
            <td style="padding: 10px 0; font-size: 18px; font-weight: bold; color: #d97706; text-align: right;">
              ${formatPrice(order.priceDetails.totalPrice)}€ <span style="font-size: 14px; color: #999; font-weight: normal;">(IVA incluido)</span>
            </td>
          </tr>
        </table>
      </div>
      `
          : ''
      }

      <h3 style="color: #333; margin-top: 20px;">Información de Contacto</h3>
      <p style="color: #666;">Si tienes alguna pregunta o necesitas modificar tu pedido, no dudes en contactarnos:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr>
          <td style="padding: 8px; color: #666;">Correo electrónico:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${adminEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666;">Teléfono:</td>
          <td style="padding: 8px; color: #333; font-weight: bold;">${translations.footer.contact.phone || 'No especificado'}</td>
        </tr>
      </table>
    </div>
  `;

  // Contenido del correo para el cliente (Texto plano sin Markdown)
  const textContentClient = `
¡Gracias por tu pedido, ${order.fullName || 'Cliente'}!

Hemos recibido tu pedido con éxito. A continuación, te mostramos un resumen de tu solicitud. Nos pondremos en contacto contigo pronto para confirmar los detalles.

Resumen de tu Pedido:
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
- Extras de mariscos: ${order.seafoodExtras.map((extraId) => seafoodExtrasNames[extraId] || extraId).join(', ') || 'Ninguno'} (Para ${seafoodPortions} porciones de ${seafoodExtrasType})`
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
Total: ${formatPrice(order.priceDetails.totalPrice)}€ (IVA incluido)
`
    : ''
}

Información de Contacto:
Si tienes alguna pregunta o necesitas modificar tu pedido, no dudes en contactarnos:
- Correo electrónico: ${adminEmail}
- Teléfono: ${translations.footer.contact.phone || 'No especificado'}
  `;

  // Asunto del correo para el administrador (formato para Trello)
  const adminEmailSubject = `Pedido #${orderNumber} - ${order.fullName || 'Cliente'} - ${order.guests || 'N/A'} pax`;

  // Asunto del correo para el cliente (nuevo formato con emoji)
  const clientEmailSubject = `🥘 Paella & Songs - ¡Pedido #${orderNumber} Recibido!`;

  // Correo para el administrador
  const msgAdmin = {
    to: adminEmail,
    from: senderEmail,
    subject: adminEmailSubject,
    text: textContentAdmin,
    html: htmlContentAdmin
  };

  // Correo para el cliente
  const msgClient = {
    to: order.email,
    from: senderEmail,
    subject: clientEmailSubject,
    text: textContentClient,
    html: htmlContentClient
  };

  try {
    console.log('Intentando enviar correos con SendGrid...');

    // Enviar ambos correos
    await sgMail.send(msgAdmin);
    console.log('Correo enviado al administrador exitosamente:', adminEmail);

    if (order.email) {
      await sgMail.send(msgClient);
      console.log('Correo enviado al cliente exitosamente:', order.email);
    } else {
      console.warn('No se proporcionó un correo del cliente para enviar la confirmación.');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Formulario enviado exitosamente' })
    };
  } catch (error) {
    console.error('Error enviando los correos:', error);
    if (error.response) {
      console.error('Detalles del error de SendGrid:', error.response.body);
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error enviando el formulario', details: error.message })
    };
  }
};