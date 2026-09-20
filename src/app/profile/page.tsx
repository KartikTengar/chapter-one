"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BRANCH_OPTIONS } from "@/lib/profile/branches";

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  year: string;
  branch: string;
  college_id: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    year: "",
    branch: "",
    college_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, phone, year, branch, college_id")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setForm({
          full_name: profileData.full_name,
          phone: profileData.phone || "",
          year: profileData.year || "",
          branch: profileData.branch || "",
          college_id: profileData.college_id || "",
        });
      }
      setLoading(false);
    }).catch(() => {
      router.replace("/login");
    });
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const fullName = form.full_name.trim();
    if (!fullName) {
      setError("Full name is required.");
      return;
    }
    if (!form.branch) {
      setError("Please select your branch.");
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: form.phone,
        year: form.year,
        branch: form.branch,
        college_id: form.college_id,
      })
      .eq("id", user.id);

    if (err) {
      setError("Failed to update profile.");
    } else {
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--accent)] text-lg font-bold animate-pulse">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="student-page min-h-screen bg-[var(--background)]">
      <div className="max-container max-w-2xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">
            My Profile
          </h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="rounded-full px-5 py-2.5 bg-[var(--accent)] text-[var(--background)] font-bold text-sm transition-all hover:bg-opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="rounded-full px-5 py-2.5 border border-white/[0.12] text-[var(--foreground)] text-sm font-medium transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Cancel
            </button>
          )}
        </div>

        {success && (
          <div className="mb-6 bg-[var(--accent)]/15 border border-[var(--accent)]/30 rounded-xl px-5 py-3 text-[var(--accent)] text-sm font-medium">
            Profile updated successfully.
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/15 border border-red-500/30 rounded-xl px-5 py-3 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-8">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                disabled={!editing}
                className="w-full rounded-xl bg-[var(--background)] border border-white/[0.06] px-4 py-3 text-[var(--foreground)] text-base outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full rounded-xl bg-[var(--background)] border border-white/[0.06] px-4 py-3 text-zinc-500 text-base outline-none disabled:opacity-60"
              />
              <p className="text-xs text-zinc-500 mt-1">Email is read-only.</p>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={!editing}
                className="w-full rounded-xl bg-[var(--background)] border border-white/[0.06] px-4 py-3 text-[var(--foreground)] text-base outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                Year
              </label>
              <select
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                disabled={!editing}
                className="w-full rounded-xl bg-[var(--background)] border border-white/[0.06] px-4 py-3 text-[var(--foreground)] text-base outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors disabled:opacity-60"
              >
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                Branch
              </label>
              <select
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                disabled={!editing}
                required={editing}
                aria-required={editing}
                className="w-full rounded-xl bg-[var(--background)] border border-white/[0.06] px-4 py-3 text-[var(--foreground)] text-base outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors disabled:opacity-60"
              >
                <option value="">Select your branch</option>
                {BRANCH_OPTIONS.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
              {editing && (
                <p className="text-xs text-zinc-500 mt-1">
                  Select your branch from the list. This is used for branch-wise leaderboards.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                College ID
              </label>
              <input
                type="text"
                value={form.college_id}
                onChange={(e) => setForm({ ...form, college_id: e.target.value })}
                disabled={!editing}
                className="w-full rounded-xl bg-[var(--background)] border border-white/[0.06] px-4 py-3 text-[var(--foreground)] text-base outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          {editing && (
            <button
              type="submit"
              disabled={saving}
              className="w-full mt-6 rounded-full bg-[var(--accent)] text-[var(--background)] font-bold py-4 text-base transition-all hover:bg-opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </form>
      </div>
      </main>
      <Footer />
    </>
  );
}
