import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Calendar, LogOut } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-gray-600">Loading profile...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account information</p>
      </div>

      {/* Profile Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="text-lg font-medium text-gray-900">
                {user.full_name || 'Not set'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-pink-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-medium text-gray-900">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="text-lg font-medium text-gray-900">
                {format(new Date(user.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Account Status</p>
              <p className="text-lg font-medium text-gray-900">
                {user.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-semibold">★</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Subscription</p>
              <p className="text-lg font-medium text-gray-900 capitalize">
                {user.subscription_type || 'Free'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Logout Button */}
      <Card className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Sign Out</h3>
            <p className="text-sm text-gray-600">Sign out of your account</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </Card>
    </div>
  );
}

