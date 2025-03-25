import React from 'react';

export default function Legal() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8">Política de Privacidad y Términos de Uso</h1>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Política de Privacidad</h2>
            <p className="text-gray-600 mb-4">
              Recopilamos datos para procesar tu pedido y mejorar tu experiencia. La información que recopilamos incluye:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>Nombre y datos de contacto para procesar tu pedido</li>
              <li>Ubicación para verificar la disponibilidad del servicio</li>
              <li>Preferencias de pedido para personalizar tu experiencia</li>
            </ul>
            <p className="text-gray-600">
              Tus datos están seguros y nunca los compartiremos con terceros sin tu consentimiento explícito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Términos de Uso</h2>
            <p className="text-gray-600 mb-4">
              Al utilizar nuestro servicio, aceptas:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Proporcionar información precisa y completa</li>
              <li>Respetar nuestras políticas de cancelación y modificación</li>
              <li>Usar el servicio de manera responsable y legal</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p className="text-gray-600 mb-4">
              Utilizamos cookies para:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Mejorar la navegación y experiencia del usuario</li>
              <li>Recordar tus preferencias</li>
              <li>Analizar el uso de nuestro sitio web</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}