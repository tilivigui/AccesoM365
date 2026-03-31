import React from 'react';
import { supabase } from '../lib/supabase';
import { LogIn } from 'lucide-react';

export const Auth: React.FC = () => {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'User.Read User.Read.All Calendars.ReadWrite Place.Read.All',
      },
    });

    if (error) {
      console.error('Error logging in with Microsoft:', error.message);
      alert('Login error: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          M365 Room Management
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Manage your meeting room reservations with ease.
        </p>
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#0078d4] hover:bg-[#005a9e] text-white font-semibold rounded-md transition-colors"
        >
          <LogIn size={20} />
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
};
