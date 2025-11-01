export interface Property {
  id: string;
  landlord_id: string;
  title: string;
  description: string;
  property_type: string;
  location: string;
  monthly_rent: number;
  status: string;
  created_at: string;
  updated_at: string;
  amenities?: string[];
  photos?: PropertyPhoto[];
  landlord?: Landlord;
}

export interface PropertyPhoto {
  id: string;
  property_id: string;
  photo_url: string;
  display_order: number;
  created_at: string;
}

export interface Landlord {
  id: string;
  full_name: string;
  phone_number: string;
  created_at: string;
}

export const PROPERTY_TYPES = [
  'Single Room',
  'Bedsitter',
  '1-Bedroom',
  '2-Bedroom',
  '3-Bedroom',
  '3+ Bedroom House',
] as const;

export const LOCATIONS = [
  'Dumboini',
  'Rungiri',
  'Kikuyu',
  'Other',
] as const;

export const AMENITIES = [
  'WiFi',
  'Parking',
  'Water Included',
  '24/7 Security',
  'Furnished',
] as const;
