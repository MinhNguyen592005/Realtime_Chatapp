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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen bg-slate-950">
      {currentUser ? (
        <ChatDashboard currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}
