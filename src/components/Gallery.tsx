import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Gallery: React.FC = () => {
  const { t } = useTranslation();
  const photoPaths = import.meta.glob('/src/assets/images/paella-event-*.jpg', { eager: true });
  const allPhotos = Object.values(photoPaths).map((photo, index) => photo.default);

  const [displayedPhotos, setDisplayedPhotos] = useState<string[]>([]);

  useEffect(() => {
    const shuffle = (array: string[]) => [...array].sort(() => Math.random() - 0.5);
    const shuffledPhotos = shuffle(allPhotos);
    setDisplayedPhotos(shuffledPhotos.slice(0, 6));
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-amber-50 to-gray-100 border-t border-gray-200" aria-label="Galería de fotos">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-center text-amber-600" itemProp="name">{t('gallery.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayedPhotos.map((photo, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg aspect-w-4 aspect-h-3 shadow-md hover:shadow-lg transition-shadow"
              style={{ background: '#fff' }}
              itemProp="image"
              itemScope
              itemType="https://schema.org/ImageObject"
            >
              <img
                src={photo}
                alt={t('gallery.photoAlt', { index: index + 1 })}
                className="w-full h-full object-cover"
                loading="lazy"
                itemProp="contentUrl"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;