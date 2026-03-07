import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/authService';
import DonationModal from './DonationModal';

const DonateButton: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleDonate = () => {
    if (!user) {
      // Redirect to login or show login modal
      window.location.href = '/login';
      return;
    }
    setShowModal(true);
  };

  return (
    <>
      <button
        onClick={handleDonate}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        Donate
      </button>

      {showModal && (
        <DonationModal 
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default DonateButton;