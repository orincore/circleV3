import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SSOCallbackHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the redirect URL from query params
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get("sign_up_fallback_redirect_url") || "/login"; 

    // Redirect user after a short delay
    setTimeout(() => {
      navigate(redirectUrl, { replace: true });
    }, 1000);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
      <p className="text-gray-600">
        If you are not redirected, <a href="/login" className="text-blue-500 underline">click here</a>.
      </p>
    </div>
  );
}

export default SSOCallbackHandler;
