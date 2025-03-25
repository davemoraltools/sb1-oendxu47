import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ca', name: 'Català' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

export default function LanguageIcon() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white rounded-full p-3 shadow-md hover:bg-gray-100 focus:outline-none group relative"
        aria-label="Cambiar idioma"
      >
        <Globe size={24} className="text-amber-600" />
        <span className="absolute top-0 right-12 bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
          Cambiar idioma
        </span>
      </button>
      {isOpen && (
        <div className="absolute top-12 right-0 bg-white border border-gray-300 rounded-md shadow-lg mt-2 w-36 animate-fadeInSlideDown">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 ${
                i18n.language === language.code ? 'font-bold' : ''
              } uppercase`} // Añadimos 'uppercase' para mayúsculas
            >
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}