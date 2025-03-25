import React from 'react';
import { Phone, Mail, Instagram, Facebook, Globe } from 'lucide-react';
import Logo from './Logo';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-amber-900 text-amber-50 py-10">
      <div className="container mx-auto px-4">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo className="w-24 h-24" />
        </div>

        {/* Contenido del Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          
          {/* Sección de Contacto */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('footer.contact.title')}</h3>
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex items-center gap-2">
                <Phone size={18} />
                <span>{t('footer.contact.phone')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <a href="mailto:info@paellaandsongs.com" className="hover:text-amber-300 transition-colors">
                  {t('footer.contact.email')}
                </a>
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('footer.social.title')}</h3>
            <div className="flex justify-center md:justify-start gap-4">
              <a href="https://www.instagram.com/paellaandsongs/" 
                 className="hover:text-amber-300 transition-colors"
                 target="_blank"
                 rel="noopener noreferrer">
                <Instagram size={22} />
              </a>
              <a href="https://www.facebook.com/autentica"
                 className="hover:text-amber-300 transition-colors"
                 target="_blank"
                 rel="noopener noreferrer">
                <Facebook size={22} />
              </a>
            </div>
          </div>

          {/* Enlaces Legales */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('footer.links.title')}</h3>
            <div className="flex flex-col items-center md:items-start gap-2 text-sm">
              <a href="/legal" className="hover:text-amber-300">{t('footer.quickLinks.privacy')}</a>
              <a href="/legal" className="hover:text-amber-300">{t('footer.quickLinks.terms')}</a>
              <div className="flex items-center gap-2">
                <LanguageSelector variant="footer" />
              </div>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-amber-200/80 mt-8">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}