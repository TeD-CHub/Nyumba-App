/*
  # Dumboini Rentals Database Schema

  ## Overview
  This migration creates the complete database structure for a property rental marketplace
  connecting landlords with tenants in the Kiambu County area.

  ## New Tables
  
  ### `landlords`
  Stores landlord account information linked to Supabase auth
  - `id` (uuid, FK to auth.users) - Primary key linked to authentication
  - `full_name` (text) - Landlord's full name
  - `phone_number` (text) - Contact phone number
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### `properties`
  Main table for rental property listings
  - `id` (uuid) - Primary key
  - `landlord_id` (uuid, FK) - References landlords table
  - `title` (text) - Property listing title
  - `description` (text) - Detailed property description
  - `property_type` (text) - Type: Single Room, Bedsitter, 1-Bedroom, 2-Bedroom, 3-Bedroom, 3+ Bedroom House
  - `location` (text) - Specific location (Dumboini, Rungiri, etc.)
  - `monthly_rent` (integer) - Rent amount in KSh
  - `status` (text) - Status: available, rented (default: available)
  - `created_at` (timestamptz) - Listing creation date
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `property_amenities`
  Junction table for property amenities (many-to-many relationship)
  - `id` (uuid) - Primary key
  - `property_id` (uuid, FK) - References properties
  - `amenity` (text) - Amenity name: WiFi, Parking, Water Included, 24/7 Security, Furnished
  
  ### `property_photos`
  Stores property photo URLs
  - `id` (uuid) - Primary key
  - `property_id` (uuid, FK) - References properties
  - `photo_url` (text) - URL to photo storage
  - `display_order` (integer) - Photo ordering (default: 0)
  - `created_at` (timestamptz) - Upload timestamp

  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with the following policies:
  
  #### landlords table
  - Public can view landlord contact info (for property inquiries)
  - Authenticated landlords can view their own profile
  - Authenticated landlords can update their own profile
  
  #### properties table
  - Public can view available properties
  - Authenticated landlords can view all their properties
  - Authenticated landlords can insert new properties
  - Authenticated landlords can update their own properties
  - Authenticated landlords can delete their own properties
  
  #### property_amenities table
  - Public can view amenities for available properties
  - Authenticated landlords can manage amenities for their properties
  
  #### property_photos table
  - Public can view photos for available properties
  - Authenticated landlords can manage photos for their properties

  ## Indexes
  - Properties indexed by status and monthly_rent for efficient filtering
  - Properties indexed by location for location-based searches
  - Foreign key indexes for optimal join performance
*/

-- Create landlords table
CREATE TABLE IF NOT EXISTS landlords (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  property_type text NOT NULL,
  location text NOT NULL,
  monthly_rent integer NOT NULL,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create property_amenities table
CREATE TABLE IF NOT EXISTS property_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity text NOT NULL
);

ALTER TABLE property_amenities ENABLE ROW LEVEL SECURITY;

-- Create property_photos table
CREATE TABLE IF NOT EXISTS property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_rent ON properties(monthly_rent);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_amenities_property ON property_amenities(property_id);
CREATE INDEX IF NOT EXISTS idx_photos_property ON property_photos(property_id);

-- RLS Policies for landlords table
CREATE POLICY "Public can view landlord contact info"
  ON landlords FOR SELECT
  USING (true);

CREATE POLICY "Landlords can view own profile"
  ON landlords FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Landlords can update own profile"
  ON landlords FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Landlords can insert own profile"
  ON landlords FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for properties table
CREATE POLICY "Public can view available properties"
  ON properties FOR SELECT
  USING (status = 'available');

CREATE POLICY "Landlords can view own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = landlord_id);

-- RLS Policies for property_amenities table
CREATE POLICY "Public can view amenities for available properties"
  ON property_amenities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_amenities.property_id
      AND properties.status = 'available'
    )
  );

CREATE POLICY "Landlords can view amenities for own properties"
  ON property_amenities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_amenities.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can insert amenities for own properties"
  ON property_amenities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_amenities.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can delete amenities for own properties"
  ON property_amenities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_amenities.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

-- RLS Policies for property_photos table
CREATE POLICY "Public can view photos for available properties"
  ON property_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.status = 'available'
    )
  );

CREATE POLICY "Landlords can view photos for own properties"
  ON property_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can insert photos for own properties"
  ON property_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can delete photos for own properties"
  ON property_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.landlord_id = auth.uid()
    )
  );