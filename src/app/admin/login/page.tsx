"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B0D15] px-4 py-12">
      <div className="max-w-md w-full">
        {/* Admin branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight uppercase text-[#F5D06E] mb-1">
            ADMIN ACCESS
          </h1>
          <p className="text-zinc-500 text-sm tracking-[0.2em] uppercase">
            SecureMailScope / Freshers Control
          </p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#121620] border border-white/[0.08] rounded-2xl p-8 shadow-2xl shadow-black/40"
        >
          <h2 className="text-xl font-bold text-white mb-1">Admin Login</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Authorized personnel only. All access is audited.
          </p>

          <LoginForm redirectTo="/admin" />
        </motion.div>
      </div>
    </main>
  );
}