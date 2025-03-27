// FallbackRedirect.jsx or FallbackRedirect.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const FallbackRedirect = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fallbackParam = params.get('after_sign_in_url');
    if (fallbackParam) {
      const decodedUrl = decodeURIComponent(fallbackParam);
      console.log('Decoded fallback URL:', decodedUrl);
      // Check if the decoded URL matches your expected home URL.
      if (decodedUrl === `${window.location.origin}/login`) {
        console.log('Redirecting to /login');
        // Use full page reload to replace the current URL.
        window.location.replace('/login');
      }
    }
  }, [location]);

  return null;
};

export default FallbackRedirect;
