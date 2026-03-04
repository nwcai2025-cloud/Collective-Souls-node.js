import React from 'react';
import { useNavigate } from 'react-router-dom';

const ClickableAvatar = ({ user, size = 'w-12 h-12', className = '' }) => {
  const navigate = useNavigate();

  const getAvatarDisplay = () => {
    // If user has uploaded profile image, use it
    if (user.profile_image) {
      // Handle both absolute URLs and relative paths
      let imageUrl = user.profile_image;
      
      // If it's a relative path (not starting with http), construct the full URL
      if (!imageUrl.startsWith('http')) {
        // Try different possible URL patterns
        const baseUrl = window.location.origin;
        
        // Check if it's already a full path or just filename
        if (imageUrl.includes('/uploads/')) {
          imageUrl = `${baseUrl}${imageUrl}`;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = `${baseUrl}${imageUrl}`;
        } else {
          imageUrl = `${baseUrl}/uploads/${imageUrl}`;
        }
      }
      
      console.log('Avatar URL:', imageUrl); // Debug log
      
      return (
        <img 
          src={imageUrl} 
          alt={`${user.username}'s profile`}
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            console.error('Avatar image failed to load:', imageUrl); // Debug log
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            const fallback = e.target.nextElementSibling;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      );
    }
    
    // Fallback to initials
    const initials = user.first_name 
      ? `${user.first_name.charAt(0)}${user.last_name ? user.last_name.charAt(0) : ''}`
      : user.username.charAt(0);
    
    console.log('Using initials fallback:', initials); // Debug log
    
    return (
      <div className="w-full h-full bg-gradient-to-br from-mindful-purple via-serene-blue to-calm-green rounded-full flex items-center justify-center text-white font-semibold">
        {initials.toUpperCase()}
      </div>
    );
  };

  const handleClick = () => {
    if (user.username) {
      navigate(`/profile/${user.username}`);
    }
  };

  return (
    <div 
      className={`relative group cursor-pointer ${size} ${className}`}
      onClick={handleClick}
      title={`View ${user.username}'s profile`}
    >
      {getAvatarDisplay()}
      
      {/* Online indicator overlay */}
      {user.is_online && (
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
      )}
      
      {/* Hover effect */}
      <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
    </div>
  );
};

export default ClickableAvatar;