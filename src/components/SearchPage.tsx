import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Property, PROPERTY_TYPES, AMENITIES } from '../types';
import PropertyCard from './PropertyCard';
import { SearchParams } from './HomePage';

interface SearchPageProps {
  onNavigate: (page: string, data?: { propertyId?: string }) => void;
  initialParams?: SearchParams;
}

export default function SearchPage({ onNavigate, initialParams }: SearchPageProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    location: initialParams?.location || '',
    propertyTypes: initialParams?.propertyType ? [initialParams.propertyType] : [] as string[],
    minPrice: 0,
    maxPrice: initialParams?.maxPrice || 100000,
    amenities: [] as string[],
  });

  useEffect(() => {
    loadProperties();
  }, [filters]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      let query = supabase
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
          ),
          property_amenities (
            amenity
          )
        `)
        .eq('status', 'available')
        .gte('monthly_rent', filters.minPrice)
        .lte('monthly_rent', filters.maxPrice);

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.propertyTypes.length > 0) {
        query = query.in('property_type', filters.propertyTypes);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      let filteredProperties = data?.map(p => ({
        ...p,
        landlord: p.landlords,
        photos: p.property_photos?.sort((a, b) => a.display_order - b.display_order),
        amenities: p.property_amenities?.map(a => a.amenity),
      })) || [];

      if (filters.amenities.length > 0) {
        filteredProperties = filteredProperties.filter(p =>
          filters.amenities.every(amenity => p.amenities?.includes(amenity))
        );
      }

      setProperties(filteredProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePropertyType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter(t => t !== type)
        : [...prev.propertyTypes, type],
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      propertyTypes: [],
      minPrice: 0,
      maxPrice: 100000,
      amenities: [],
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Available Properties ({properties.length})
          </h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } lg:block w-full lg:w-64 bg-white p-6 rounded-lg shadow-md h-fit sticky top-20`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Dumboini"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <div className="space-y-2">
                  {PROPERTY_TYPES.map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.propertyTypes.includes(type)}
                        onChange={() => togglePropertyType(type)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (KSh)
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="5000"
                    max="100000"
                    step="5000"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>KSh {filters.minPrice.toLocaleString()}</span>
                    <span>KSh {filters.maxPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="space-y-2">
                  {AMENITIES.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <X className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 mb-2">No properties found</p>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
