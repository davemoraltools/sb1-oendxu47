import React from 'react';
import { X } from 'lucide-react';

interface IngredientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  ingredients: string;
}

const IngredientsModal: React.FC<IngredientsModalProps> = ({ isOpen, onClose, title, ingredients }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-600/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-auto min-w-[80%] max-w-[90%] md:min-w-[400px] md:max-w-md mx-auto transform rounded-lg bg-white border border-gray-200 shadow-lg transition-all duration-500 animate-modal-up">
        <div className="p-4 sm:p-6 h-auto">
          {/* Header */}
          <div className="flex flex-col items-center mb-4 sm:mb-6 w-full">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-6 h-6 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
            >
              <X className="w-full h-full" />
            </button>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 text-center mb-2 w-[calc(100%-3rem)] break-words decoration-amber-600 decoration-1 sm:decoration-2 underline transition-all duration-300">
              {`${title}:`}
            </h3>
          </div>
          
          {/* Content */}
          <div className="mt-4 sm:mt-6 mb-6 sm:mb-8">
            <ul className="list-disc list-inside pl-4 space-y-1.5 sm:space-y-2">
              {ingredients.split(', ').map((ingredient, index) => (
                <li key={index} className="text-gray-700 text-base font-medium leading-tight sm:leading-relaxed">
                  {ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Footer */}
          <div className="mt-4 sm:mt-6">
            <button
              onClick={onClose}
              className="w-full bg-amber-600 text-white px-5 py-2 sm:px-6 sm:py-3 rounded-full font-medium hover:bg-amber-700 transition-all duration-300 shadow-sm hover:shadow"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IngredientsModal;