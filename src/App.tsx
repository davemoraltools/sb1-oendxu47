import React from 'react';
import LanguageIcon from './components/LanguageIcon';
import Hero from './components/Hero';
import Calculator from './components/Calculator';
import Testimonials from './components/Testimonials';
import Gallery from './components/Gallery';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-gray-100">
      <LanguageIcon />
      <main>
        <Hero />
        <Calculator />
        <Testimonials />
        <Gallery />
        <Footer />
      </main>
    </div>
  );
}

export default App;