import { useState, useEffect } from 'react';
import { MapPin, Home, Phone, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Property } from '../types';

interface PropertyDetailPageProps {
  propertyId: string;
  onNavigate: (page: string) => void;
}

export default function PropertyDetailPage({ propertyId, onNavigate }: PropertyDetailPageProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'amenities' | 'map'>('description');
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      const { data, error } = await supabase
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
        .eq('id', propertyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProperty({
          ...data,
          landlord: data.landlords,
          photos: data.property_photos?.sort((a, b) => a.display_order - b.display_order),
          amenities: data.property_amenities?.map(a => a.amenity),
        });
      }
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Property not found</p>
          <button
            onClick={() => onNavigate('home')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const photos = property.photos && property.photos.length > 0
    ? property.photos
    : [{ photo_url: 'https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg?auto=compress&cs=tinysrgb&w=1920', display_order: 0 }];

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate('search')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to search</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="relative h-96 rounded-lg overflow-hidden mb-4">
              <img
                src={photos[currentPhotoIndex].photo_url}
                alt={property.title}
                className="w-full h-full object-cover"
              />

              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{property.title}</h1>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Home className="w-5 h-5 mr-2" />
                  <span>{property.property_type}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{property.location}</span>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-blue-600">
                  KSh {property.monthly_rent.toLocaleString()}
                </span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>

              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`pb-4 border-b-2 transition-colors ${
                      activeTab === 'description'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab('amenities')}
                    className={`pb-4 border-b-2 transition-colors ${
                      activeTab === 'amenities'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Amenities
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`pb-4 border-b-2 transition-colors ${
                      activeTab === 'map'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Location
                  </button>
                </div>
              </div>

              <div>
                {activeTab === 'description' && (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
                  </div>
                )}

                {activeTab === 'amenities' && (
                  <div className="grid grid-cols-2 gap-4">
                    {property.amenities && property.amenities.length > 0 ? (
                      property.amenities.map((amenity) => (
                        <div key={amenity} className="flex items-center space-x-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-gray-700">{amenity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 col-span-2">No amenities listed</p>
                    )}
                  </div>
                )}

                {activeTab === 'map' && (
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">{property.location}</p>
                    <p className="text-sm text-gray-500">Kiambu County, Kenya</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Landlord</h3>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Landlord</p>
                <p className="text-lg font-medium text-gray-900">{property.landlord?.full_name}</p>
              </div>

              {!showPhone ? (
                <button
                  onClick={() => setShowPhone(true)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Phone className="w-5 h-5" />
                  <span>Show Phone Number</span>
                </button>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Call or WhatsApp</p>
                  <a
                    href={`tel:${property.landlord?.phone_number}`}
                    className="text-xl font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {property.landlord?.phone_number}
                  </a>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  Contact the landlord to schedule a viewing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
