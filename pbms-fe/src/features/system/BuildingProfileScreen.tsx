import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../core/websocket/useWebSocket';

interface BuildingProfile {
  id?: number;
  name: string;
  address: string;
  hotline: string;
  operatingHours: string;
  rules: string;
}

export const BuildingProfileScreen = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { connected } = useWebSocket();
  
  const [formData, setFormData] = useState<BuildingProfile>({
    name: '', address: '', hotline: '', operatingHours: '', rules: ''
  });



  const { data, isLoading, isError } = useQuery({
    queryKey: ['building-profile'],
    queryFn: async () => {
      const res = await axiosClient.get('/system/building-profile');
      return res.data.data;
    }
  });

  useEffect(() => {
    if (data) setFormData(data);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (updatedProfile: BuildingProfile) => {
      const res = await axiosClient.put('/system/building-profile', updatedProfile);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building-profile'] });
      alert('Profile updated successfully!');
    },
    onError: () => {
      alert('Failed to update profile.');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(formData.hotline)) {
      alert('Hotline must be exactly 10 numeric digits.');
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) return <div className="p-8 text-center">Loading profile...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load profile.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h1 className="text-xl font-semibold text-gray-800">Building Profile Settings</h1>
          <div className="flex items-center space-x-4">
             <span className={`px-2 py-1 rounded text-xs font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              WS: {connected ? 'Connected' : 'Disconnected'}
            </span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors">
              Logout
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Building Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotline</label>
              <input
                type="text"
                name="hotline"
                value={formData.hotline}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
              <input
                type="text"
                name="operatingHours"
                value={formData.operatingHours}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Building Rules</label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              ></textarea>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
