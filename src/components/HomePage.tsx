import { useState, useEffect } from 'react';
import { Search, MapPin, Home, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Property } from '../types';
import PropertyCard from './PropertyCard';

interface HomePageProps {
  onNavigate: (page: string, data?: { searchParams?: SearchParams }) => void;
}

export interface SearchParams {
  location?: string;
  propertyType?: string;
  maxPrice?: number;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [searchLocation, setSearchLocation] = useState('');
  const [searchPropertyType, setSearchPropertyType] = useState('');
  const [searchMaxPrice, setSearchMaxPrice] = useState('');
  const [newestListings, setNewestListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewestListings();
  }, []);

  const loadNewestListings = async () => {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          *,
          landlords (
            full_name,
            phone_number
          ),
          property_photos (
            photo_url,
            display_order
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      const formattedProperties = properties?.map(p => ({
        ...p,
        landlord: p.landlords,
        photos: p.property_photos?.sort((a, b) => a.display_order - b.display_order),
      })) || [];

      setNewestListings(formattedProperties);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params: SearchParams = {};
    if (searchLocation) params.location = searchLocation;
    if (searchPropertyType) params.propertyType = searchPropertyType;
    if (searchMaxPrice) params.maxPrice = parseInt(searchMaxPrice);

    onNavigate('search', { searchParams: params });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative bg-cover bg-center h-[500px] flex items-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Find Your Perfect Home in Kiambu
            </h1>
            <p className="text-xl text-gray-200">
              Quality rentals in Dumboini, Rungiri, and surrounding areas
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Location (e.g., Dumboini)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={searchPropertyType}
                  onChange={(e) => setSearchPropertyType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">All Property Types</option>
                  <option value="Single Room">Single Room</option>
                  <option value="Bedsitter">Bedsitter</option>
                  <option value="1-Bedroom">1-Bedroom</option>
                  <option value="2-Bedroom">2-Bedroom</option>
                  <option value="3-Bedroom">3-Bedroom</option>
                  <option value="3+ Bedroom House">3+ Bedroom House</option>
                </select>
              </div>

              <div className="relative">
                <select
                  value={searchMaxPrice}
                  onChange={(e) => setSearchMaxPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Max Price</option>
                  <option value="10000">KSh 10,000</option>
                  <option value="15000">KSh 15,000</option>
                  <option value="20000">KSh 20,000</option>
                  <option value="30000">KSh 30,000</option>
                  <option value="50000">KSh 50,000</option>
                  <option value="70000">KSh 70,000</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Search Properties</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">Newest Listings</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : newestListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newestListings.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No properties available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
