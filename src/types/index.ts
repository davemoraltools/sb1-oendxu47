export type PackageRange = '10-14' | '15-19' | '20-24' | '25-40' | '40+';
export type PaellaCategory = 'meat' | 'seafood' | 'fideua';

export interface PaellaVariety {
  id: string;
  name: string;
  category: PaellaCategory;
}

export interface Package {
  id: string;
  name: string;
  pricePerPerson: number;
  description?: string;
}

export interface PaellaOrder {
  guests: number;
  date: string;
  timeSlot: string;
  location: string;
  paellaCategory: PaellaCategory;
  paellaVariety: string;
  secondPaellaCategory?: PaellaCategory;
  secondPaellaVariety?: string;
  seafoodExtras: string[];
  package: string;
  fullName: string;
  phone: string;
  email: string;
  extras: string[];
}

export interface PriceCalculation {
  basePrice: number;
  seafoodSurcharge: number;
  extrasTotal: number;
  total: number;
  deposit: number;
}