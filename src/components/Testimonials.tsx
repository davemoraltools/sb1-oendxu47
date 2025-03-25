import React from 'react';
import { Star, Quote, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STAR_COLORS = {
  fill: '#FBBF24',
  stroke: '#F59E0B'
};

const Testimonials: React.FC = () => {
  const { t } = useTranslation();

  // Array que relaciona cada persona con su clave de nombre/cita y su clave de rol
  const TESTIMONIALS = [
    {
      key: 'mariaGarcia',       // Coincide con 'names.mariaGarcia' y 'quotes.mariaGarcia'
      role: 'organizerEvents',  // Coincide con 'roles.organizerEvents'
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      key: 'juanPerez',
      role: 'loverGastronomy',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    },
    {
      key: 'lauraMartinez',
      role: 'organizerWeddings',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    }
  ];

  return (
    <section 
      className="py-24 bg-gradient-to-b from-amber-50 to-white" 
      aria-label="Testimonios"
      itemScope 
      itemType="https://schema.org/Review"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageCircle className="w-6 h-6 text-amber-500" />
            <span className="text-amber-600 font-medium">{t('testimonials.title')}</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6" itemProp="name">
            {t('testimonials.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" itemProp="description">
            {t('testimonials.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {TESTIMONIALS.map(({ key, role, image }, index) => (
            <div
              key={index}
              className="relative bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              itemProp="review"
              itemScope
              itemType="https://schema.org/Review"
            >
              <Quote
                size={48}
                className="absolute -top-4 -left-4 text-amber-200 rotate-180 opacity-50"
              />
              <div className="flex items-center gap-4 mb-6 relative">
                <img
                  src={image}
                  alt={t(`testimonials.names.${key}`)}
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-amber-100"
                />
                <div>
                  {/* Nombre */}
                  <h3 className="font-semibold text-gray-900" itemProp="author">
                    {t(`testimonials.names.${key}`)}
                  </h3>
                  {/* Rol */}
                  <p className="text-amber-600 text-sm font-medium" itemProp="reviewRating">
                    {t(`testimonials.roles.${role}`)}
                  </p>
                </div>
              </div>
              {/* Cita */}
              <p className="text-gray-600 mb-6 leading-relaxed italic" itemProp="reviewBody">
                "{t(`testimonials.quotes.${key}`)}"
              </p>
              {/* Estrellas */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    fill={STAR_COLORS.fill}
                    stroke={STAR_COLORS.stroke}
                    className="drop-shadow-sm"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;