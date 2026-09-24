import React, { useState, useEffect } from "react";
import AuthPage from "./components/auth/AuthPage";
import ChatDashboard from "./components/chat/ChatDashboard";
import { authService } from "./services/authService";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() =>
    authService.getStoredUser(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      authService
        .getCurrentUser()
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          authService.logout();
          setCurrentUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const handleAuthExpired = () => {
      setCurrentUser(null);
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handleProfileUpdated = (profile) => {
    setCurrentUser((previous) => {
      const updated = {
        ...previous,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-[#c47c68]">
        <div className="w-10 h-10 border-4 border-[#FEDBD0] border-t-[#c47c68] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen bg-white">
      {currentUser ? (
        <ChatDashboard currentUser={currentUser} onLogout={handleLogout} onProfileUpdated={handleProfileUpdated} />
      ) : (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}
