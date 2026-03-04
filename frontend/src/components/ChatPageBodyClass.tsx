import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ChatPageBodyClass: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Add or remove chat-page class based on current route
    if (location.pathname === '/chat') {
      document.body.classList.add('chat-page');
    } else {
      document.body.classList.remove('chat-page');
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('chat-page');
    };
  }, [location.pathname]);

  return null; // This component doesn't render anything
};

export default ChatPageBodyClass;