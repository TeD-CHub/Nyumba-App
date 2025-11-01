import { useState, useEffect } from 'react';
import { ChevronLeft, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PROPERTY_TYPES, LOCATIONS, AMENITIES } from '../types';

interface PropertyFormProps {
  propertyId?: string;
  onNavigate: (page: string) => void;
}

export default function PropertyForm({ propertyId, onNavigate }: PropertyFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!propertyId);

  const [formData, setFormData] = useState({
    title: '',
    propertyType: '',
    location: '',
    monthlyRent: '',
    description: '',
    selectedAmenities: [] as string[],
    photoUrls: [] as string[],
  });

  useEffect(() => {
    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_amenities (amenity),
          property_photos (photo_url, display_order)
        `)
        .eq('id', propertyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title,
          propertyType: data.property_type,
          location: data.location,
          monthlyRent: data.monthly_rent.toString(),
          description: data.description,
          selectedAmenities: data.property_amenities?.map(a => a.amenity) || [],
          photoUrls: data.property_photos
            ?.sort((a, b) => a.display_order - b.display_order)
            .map(p => p.photo_url) || [],
        });
      }
    } catch (error) {
      console.error('Error loading property:', error);
      alert('Failed to load property');
    } finally {
      setInitialLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenity)
        ? prev.selectedAmenities.filter(a => a !== amenity)
        : [...prev.selectedAmenities, amenity],
    }));
  };

  const addPhotoUrl = () => {
    const url = prompt('Enter photo URL from Pexels or other source:');
    if (url) {
      setFormData(prev => ({
        ...prev,
        photoUrls: [...prev.photoUrls, url],
      }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photoUrls: prev.photoUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!formData.title || !formData.propertyType || !formData.location || !formData.monthlyRent) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let propertyIdToUse = propertyId;

      if (propertyId) {
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            title: formData.title,
            property_type: formData.propertyType,
            location: formData.location,
            monthly_rent: parseInt(formData.monthlyRent),
            description: formData.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', propertyId);

        if (updateError) throw updateError;

        await supabase
          .from('property_amenities')
          .delete()
          .eq('property_id', propertyId);

        await supabase
          .from('property_photos')
          .delete()
          .eq('property_id', propertyId);
      } else {
        const { data: newProperty, error: insertError } = await supabase
          .from('properties')
          .insert({
            landlord_id: user.id,
            title: formData.title,
            property_type: formData.propertyType,
            location: formData.location,
            monthly_rent: parseInt(formData.monthlyRent),
            description: formData.description,
            status: 'available',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        propertyIdToUse = newProperty.id;
      }

      if (formData.selectedAmenities.length > 0) {
        const amenitiesData = formData.selectedAmenities.map(amenity => ({
          property_id: propertyIdToUse,
          amenity,
        }));

        const { error: amenitiesError } = await supabase
          .from('property_amenities')
          .insert(amenitiesData);

        if (amenitiesError) throw amenitiesError;
      }

      if (formData.photoUrls.length > 0) {
        const photosData = formData.photoUrls.map((url, index) => ({
          property_id: propertyIdToUse,
          photo_url: url,
          display_order: index,
        }));

        const { error: photosError } = await supabase
          .from('property_photos')
          .insert(photosData);

        if (photosError) throw photosError;
      }

      onNavigate('dashboard');
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to dashboard</span>
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {propertyId ? 'Edit Property' : 'Add New Property'}
          </h1>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded ${
                    s <= step ? 'bg-blue-600' : 'bg-gray-200'
                  } ${s !== 1 ? 'ml-2' : ''}`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 text-center">
              Step {step} of 3
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Spacious 2-Bedroom in Dumboini"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select location</option>
                  {LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent (KSh) *
                </label>
                <input
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                  placeholder="e.g., 20000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Description & Amenities</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  placeholder="Describe your property in detail..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Amenities
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {AMENITIES.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center space-x-2 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedAmenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Photos</h2>

              <div>
                <button
                  onClick={addPhotoUrl}
                  className="flex items-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors w-full justify-center"
                >
                  <Upload className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-600">Add Photo URL</span>
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Add photo URLs from Pexels or other sources
                </p>
              </div>

              {formData.photoUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.photoUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Property ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save and Publish'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
