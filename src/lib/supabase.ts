import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      landlords: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone_number: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone_number?: string;
          created_at?: string;
        };
      };
      properties: {
        Row: {
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
        };
        Insert: {
          id?: string;
          landlord_id: string;
          title: string;
          description?: string;
          property_type: string;
          location: string;
          monthly_rent: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          landlord_id?: string;
          title?: string;
          description?: string;
          property_type?: string;
          location?: string;
          monthly_rent?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      property_amenities: {
        Row: {
          id: string;
          property_id: string;
          amenity: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          amenity: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          amenity?: string;
        };
      };
      property_photos: {
        Row: {
          id: string;
          property_id: string;
          photo_url: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          photo_url: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          photo_url?: string;
          display_order?: number;
          created_at?: string;
        };
      };
    };
  };
};
