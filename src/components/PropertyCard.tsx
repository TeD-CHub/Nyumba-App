import { MapPin, Home } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onNavigate: (page: string, data?: { propertyId?: string }) => void;
}

export default function PropertyCard({ property, onNavigate }: PropertyCardProps) {
  const primaryPhoto = property.photos?.[0]?.photo_url || 'https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48 overflow-hidden">
        <img
          src={primaryPhoto}
          alt={property.title}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full font-semibold text-sm">
          KSh {property.monthly_rent.toLocaleString()}/mo
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
          {property.title}
        </h3>

        <div className="flex items-center text-gray-600 mb-2">
          <Home className="w-4 h-4 mr-1" />
          <span className="text-sm">{property.property_type}</span>
        </div>

        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{property.location}</span>
        </div>

        <button
          onClick={() => onNavigate('property', { propertyId: property.id })}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
