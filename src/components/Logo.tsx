import React from 'react';
import logo from '../assets/paella&songs-logo-web.png';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-20 h-20 md:w-24 md:h-24" }: LogoProps) {
  return (
    <img 
      src={logo} 
      alt="Paella & Songs" 
      className={`object-contain ${className}`}
    />
  );
}