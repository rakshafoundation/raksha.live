import { DirectoryCategory } from '@prisma/client';

export const CATEGORY_LABELS: Record<DirectoryCategory, string> = {
  NGO: 'NGOs',
  VET: 'Vets',
  VET_LAB_DIAGNOSTICS: 'Vet labs & diagnostics',
  VET_PHARMACY: 'Veterinary pharmacies',
  PET_FOOD_STORE: 'Pet food stores',
  PET_FRIENDLY_CAFE: 'Pet-friendly cafes',
  TOY_ACCESSORY_SHOP: 'Toy & accessory shops',
  GROOMER: 'Groomers',
  BOARDING: 'Boarding',
  TRAINER: 'Trainers',
  AMBULANCE: 'Animal ambulances',
};

// Marker/dot colors per category for the map view — hex values since
// Google Maps marker icons take raw color, not Tailwind classes.
export const CATEGORY_MARKER_COLOR: Record<DirectoryCategory, string> = {
  NGO: '#16a34a',
  VET: '#2563eb',
  VET_LAB_DIAGNOSTICS: '#7c3aed',
  VET_PHARMACY: '#0891b2',
  PET_FOOD_STORE: '#ea580c',
  PET_FRIENDLY_CAFE: '#ca8a04',
  TOY_ACCESSORY_SHOP: '#db2777',
  GROOMER: '#65a30d',
  BOARDING: '#4f46e5',
  TRAINER: '#dc2626',
  AMBULANCE: '#e11d48',
};
