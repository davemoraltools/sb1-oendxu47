import React from 'react';
import Logo from './Logo';

export default function Header() {
  return (
    <header className="fixed w-full bg-white/95 backdrop-blur-sm shadow-sm z-50 top-0">
      <nav className="container mx-auto px-4 py-2">
        <div className="flex justify-center items-center">
          <a href="#" className="flex items-center gap-2">
            <Logo className="w-10 h-10 md:w-12 md:h-12" />
            <span className="text-2xl font-bold text-amber-600">
              Paella & Songs
            </span>
          </a>
        </div>
      </nav>
    </header>
  );
}