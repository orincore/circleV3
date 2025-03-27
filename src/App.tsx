// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Welcome } from "./pages/auth/Welcome";
import { Login } from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ProfileSetup from "./pages/auth/ProfileSetup";
import { Home } from "./pages/Home";
import { Explore } from "./pages/Explore";
import { Create } from "./pages/Create";
import Messages from "./pages/Messages";
import { Profile } from "./pages/Profile";
import { Layout } from "./components/Layout";
import AuthWrapper from "./components/AuthWrapper";
import { ChatProvider } from "./components/chat/ChatProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider, useAuth } from "./components/AuthContext";
import OtherUserProfile from "./pages/OtherUserProfile"; // Add this import

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />

            {/* Root route */}
            <Route
              path="/"
              element={
                <AuthCheck>
                  {(isAuthenticated) => (
                    isAuthenticated ? <Navigate to="/home" replace /> : <Welcome />
                  )}
                </AuthCheck>
              }
            />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AuthWrapper>
                    <ChatProvider>
                      <Layout />
                    </ChatProvider>
                  </AuthWrapper>
                </ProtectedRoute>
              }
            >
              <Route path="/home" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/create" element={<Create />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              {/* Add the new profile route */}
              <Route path="/profile/:userId" element={<OtherUserProfile />} />
            </Route>

            {/* Fallback for non-existent routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

// Helper component for authentication check
function AuthCheck({ children }: { children: (isAuthenticated: boolean) => React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return children(!!user);
}

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default App;