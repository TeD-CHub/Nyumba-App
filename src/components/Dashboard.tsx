import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Property } from '../types';

interface DashboardProps {
  onNavigate: (page: string, data?: { propertyId?: string; mode?: string }) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_photos (
            photo_url,
            display_order
          )
        `)
        .eq('landlord_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProperties = data?.map(p => ({
        ...p,
        photos: p.property_photos?.sort((a, b) => a.display_order - b.display_order),
      })) || [];

      setProperties(formattedProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(properties.filter(p => p.id !== propertyId));
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const handleToggleStatus = async (propertyId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'available' ? 'rented' : 'available';

      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(properties.map(p =>
        p.id === propertyId ? { ...p, status: newStatus } : p
      ));
    } catch (error) {
      console.error('Error updating property status:', error);
      alert('Failed to update property status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
          <button
            onClick={() => onNavigate('add-property')}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Property</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-64 h-48 sm:h-auto">
                    <img
                      src={property.photos?.[0]?.photo_url || 'https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {property.title}
                        </h3>
                        <p className="text-gray-600 mb-2">{property.property_type} • {property.location}</p>
                        <p className="text-2xl font-bold text-blue-600">
                          KSh {property.monthly_rent.toLocaleString()}/mo
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          property.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {property.status === 'available' ? 'Available' : 'Rented'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => onNavigate('property', { propertyId: property.id })}
                        className="flex items-center space-x-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => onNavigate('edit-property', { propertyId: property.id })}
                        className="flex items-center space-x-1 px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(property.id, property.status)}
                        className="flex items-center space-x-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {property.status === 'available' ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        <span>Mark as {property.status === 'available' ? 'Rented' : 'Available'}</span>
                      </button>

                      <button
                        onClick={() => handleDelete(property.id)}
                        className="flex items-center space-x-1 px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-4">No properties yet</p>
            <button
              onClick={() => onNavigate('add-property')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Property</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
