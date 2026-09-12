import React, { useState } from "react";
import { authService } from "../../services/authService";
import {
  MessageSquare,
  Lock,
  User,
  Mail,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from "lucide-react";

export default function AuthPage({ onAuthSuccess }) {
  // authMode: 'login' | 'register' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot / Reset password state
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation regex
  const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;
  const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

  const validatePasswordRule = (pwd) => {
    if (!pwd || pwd.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự.";
    }
    if (!SPECIAL_CHAR_REGEX.test(pwd)) {
      return "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...).";
    }
    return null;
  };

  const validateEmailRule = (em) => {
    if (!em || !EMAIL_REGEX.test(em.trim())) {
      return "Email không đúng định dạng (ví dụ: user@example.com).";
    }
    return null;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const data = await authService.login(username, password);
      onAuthSuccess(data.user);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Tên đăng nhập hoặc mật khẩu không chính xác.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Validate username
    if (
      !username ||
      username.trim().length < 3 ||
      username.trim().length > 50
    ) {
      setError("Tên đăng nhập phải có từ 3 đến 50 ký tự.");
      return;
    }

    // Validate email
    const emailErr = validateEmailRule(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    // Validate password
    const pwdErr = validatePasswordRule(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    setLoading(true);

    try {
      await authService.register(username.trim(), email.trim(), password);
      // Auto login after registration
      const data = await authService.login(username.trim(), password);
      onAuthSuccess(data.user);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Đăng ký tài khoản không thành công. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const emailErr = validateEmailRule(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setLoading(true);

    try {
      const res = await authService.forgotPassword(email.trim());
      setSuccessMsg(
        res.message ||
          "Mã xác thực OTP đã được gửi tới email của bạn (hiệu lực trong 15 phút).",
      );
      setAuthMode("reset");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Không thể gửi mã xác nhận. Vui lòng kiểm tra lại email.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const emailErr = validateEmailRule(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      setError("Mã OTP phải bao gồm 6 chữ số.");
      return;
    }

    const pwdErr = validatePasswordRule(newPassword);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPassword(
        email.trim(),
        otp.trim(),
        newPassword,
      );
      setSuccessMsg(
        res.message ||
          "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.",
      );
      setPassword("");
      setNewPassword("");
      setOtp("");
      setAuthMode("login");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Đặt lại mật khẩu không thành công. Vui lòng kiểm tra mã OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 text-slate-100">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-3 shadow-inner">
            <MessageSquare className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Realtime Chat{" "}
            <Sparkles className="w-5 h-5 text-indigo-400 inline" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hệ thống nhắn tin thời gian thực đa người dùng
          </p>
        </div>

        {/* Tab Toggle (Only shown on Login / Register) */}
        {(authMode === "login" || authMode === "register") && (
          <div className="flex bg-slate-800/60 p-1 rounded-xl mb-6 border border-slate-700/50">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                authMode === "login"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                authMode === "register"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Đăng Ký
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. FORM ĐĂNG NHẬP */}
        {authMode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("forgot");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Đăng Nhập"
              )}
            </button>
          </form>
        )}

        {/* 2. FORM ĐĂNG KÝ */}
        {authMode === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Từ 3 đến 50 ký tự..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ít nhất 8 ký tự và 1 ký tự đặc biệt (!@#$...)"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                * Quy định: Mật khẩu từ 8 ký tự trở lên và phải có ít nhất 1 ký
                tự đặc biệt.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Tạo Tài Khoản"
              )}
            </button>
          </form>
        )}

        {/* 3. FORM QUÊN MẬT KHẨU (BƯỚC 1: NHẬP EMAIL) */}
        {authMode === "forgot" && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-base font-semibold text-white">
                Khôi Phục Mật Khẩu
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Nhập email tài khoản của bạn để nhận mã xác thực OTP 6 số.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email tài khoản
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Gửi Mã Xác Nhận"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setError("");
                setSuccessMsg("");
              }}
              className="w-full py-2 text-xs font-medium text-slate-400 hover:text-white flex items-center justify-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Đăng nhập
            </button>
          </form>
        )}

        {/* 4. FORM ĐẶT LẠI MẬT KHẨU (BƯỚC 2: NHẬP OTP & MẬT KHẨU MỚI) */}
        {authMode === "reset" && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-base font-semibold text-white">
                Nhập Mã OTP & Mật Khẩu Mới
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Mã OTP 6 số đã được gửi tới:{" "}
                <strong className="text-indigo-300">{email}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mã xác thực OTP (6 chữ số)
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 tracking-widest text-center font-mono text-base focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 8 ký tự và 1 ký tự đặc biệt..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                * Tối thiểu 8 ký tự và có ít nhất 1 ký tự đặc biệt (!@#$...).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Xác Nhận Đổi Mật Khẩu"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setError("");
                setSuccessMsg("");
              }}
              className="w-full py-2 text-xs font-medium text-slate-400 hover:text-white flex items-center justify-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Đăng nhập
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
