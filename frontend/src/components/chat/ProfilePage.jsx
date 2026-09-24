import React, { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Pencil, UserRound, X } from "lucide-react";
import { profileService } from "../../services/profileService";

const emptyForm = { displayName: "", avatarUrl: "", bio: "" };

export default function ProfilePage({ userId, currentUser, onClose, onUpdated }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isOwnProfile = userId === currentUser.id;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setProfile(null);
    setError("");
    setSuccess("");
    setEditing(false);
    profileService.getProfile(userId, currentUser.id)
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setForm({
          displayName: data.displayName || data.username,
          avatarUrl: data.avatarUrl || "",
          bio: data.bio || "",
        });
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Không tải được trang cá nhân.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [userId, currentUser.id]);

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.displayName.trim()) {
      setError("Tên hiển thị không được để trống.");
      return;
    }
    setSaving(true);
    try {
      const updated = await profileService.updateMyProfile({
        displayName: form.displayName.trim(),
        avatarUrl: form.avatarUrl.trim(),
        bio: form.bio.trim(),
      });
      setProfile(updated);
      setEditing(false);
      setSuccess("Đã lưu trang cá nhân.");
      onUpdated(updated);
    } catch (err) {
      setError(err.response?.data?.message || "Không lưu được trang cá nhân.");
    } finally {
      setSaving(false);
    }
  };

  const avatar = profile?.avatarUrl ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile?.username || "user")}`;

  return (
    <main className="flex-1 min-w-0 h-full overflow-y-auto bg-white text-slate-900">
      <div className="max-w-2xl mx-auto px-5 py-6 sm:px-8 sm:py-8">
        <button type="button" onClick={onClose}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#a6533e] mb-6">
          <ArrowLeft className="w-4 h-4" /> Trở lại trò chuyện
        </button>

        {loading ? (
          <p className="text-sm text-slate-500">Đang tải trang cá nhân...</p>
        ) : !profile ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error || "Không tìm thấy người dùng."}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-[#FEDBD0] via-[#fff0eb] to-white" />
            <div className="px-6 pb-7 sm:px-8">
              <div className="flex items-end justify-between gap-3 -mt-10 mb-5">
                <img src={avatar} alt={profile.displayName || profile.username}
                  className="w-20 h-20 rounded-2xl border-4 border-white bg-slate-100 object-cover shadow-sm" />
                {isOwnProfile && !editing && (
                  <button type="button" onClick={() => { setEditing(true); setSuccess(""); }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#FEDBD0] px-4 py-2 text-sm font-medium hover:bg-[#f4c5b6]">
                    <Pencil className="w-4 h-4" /> Chỉnh sửa
                  </button>
                )}
              </div>

              <h1 className="text-2xl font-bold break-words">{profile.displayName || profile.username}</h1>
              <p className="text-sm text-slate-500 mt-1">@{profile.username}</p>
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${profile.status === "ONLINE" ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {profile.status === "ONLINE" ? "Đang hoạt động" : "Ngoại tuyến"}
                </span>
                {profile.createdAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> Tham gia {new Date(profile.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>

              {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              {success && <p role="status" className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

              {editing ? (
                <form onSubmit={handleSave} className="mt-6 space-y-5 border-t border-slate-200 pt-6">
                  <label className="block text-sm font-medium text-slate-700">
                    Tên hiển thị
                    <input required maxLength={80} value={form.displayName}
                      onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#c47c68]" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    URL ảnh đại diện
                    <input type="url" maxLength={500} value={form.avatarUrl}
                      onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#c47c68]" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Giới thiệu
                    <textarea maxLength={500} rows={4} value={form.bio}
                      onChange={(event) => setForm({ ...form, bio: event.target.value })}
                      placeholder="Viết vài dòng về bạn..."
                      className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#c47c68]" />
                    <span className="block text-right text-xs text-slate-400">{form.bio.length}/500</span>
                  </label>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => { setEditing(false); setError(""); setForm({ displayName: profile.displayName || profile.username, avatarUrl: profile.avatarUrl || "", bio: profile.bio || "" }); }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
                      <X className="w-4 h-4" /> Hủy
                    </button>
                    <button type="submit" disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#FEDBD0] px-4 py-2 text-sm font-medium hover:bg-[#f4c5b6] disabled:opacity-50">
                      <Check className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-7 space-y-5 border-t border-slate-200 pt-6">
                  <section>
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700"><UserRound className="w-4 h-4" /> Giới thiệu</h2>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                      {profile.bio || "Chưa có giới thiệu."}
                    </p>
                  </section>
                  {isOwnProfile && (
                    <section className="rounded-xl bg-slate-50 px-4 py-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email đăng ký · chỉ bạn thấy</h2>
                      <p className="mt-1 text-sm text-slate-700 break-all">{profile.email}</p>
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
