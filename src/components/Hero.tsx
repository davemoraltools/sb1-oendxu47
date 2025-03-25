import React from 'react';
import { ChefHat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import heroImage from '../assets/paella-hero.jpg';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section id="inicio" className="relative" aria-label="Inicio">
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${heroImage})` }}
        role="img"
        aria-label="Paella valenciana preparada en evento"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent z-0" />
      <div className="container mx-auto px-4">
        <div className="min-h-[80vh] flex items-center justify-center relative z-10">
          <div className="max-w-4xl text-center bg-black/50 p-8 rounded-xl backdrop-blur-sm">
            <div className="flex justify-center mb-6">
              <Logo className="w-32 h-32 md:w-40 md:h-40" alt="Logo de Paella & Songs" />
            </div>
            <div className="inline-flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full text-amber-700 mb-4">
              <ChefHat size={20} />
              <span>{t('hero.tagline')}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-white" itemProp="name">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-gray-200 mb-6 max-w-3xl mx-auto" itemProp="description">
              {t('hero.description')}
            </p>
            <a
              href="#calculator"
              className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-red-600 transition-colors"
            >
              {t('hero.cta')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}