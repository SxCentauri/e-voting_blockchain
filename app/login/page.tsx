// app/login/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
// Update Import: Tambahkan Eye dan EyeOff
import { Lock, Mail, ArrowRight, ShieldAlert, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // State baru untuk visibility password
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        toast.success("Login Berhasil! Mengarahkan...");
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (profile?.role === 'admin') router.push('/admin');
        else router.push('/');
      }
    } catch (error: any) {
      toast.error("Gagal Masuk: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 pattern-grid-lg">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>

        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mb-4 border border-blue-500/20"
          >
            <Lock size={24} />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Akses Terbatas</h1>
          <p className="text-zinc-400 text-sm">Masuk menggunakan akun yang terdaftar.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-zinc-500" size={18} />
            <input
              type="email" placeholder="Email"
              className="w-full bg-zinc-950 border border-zinc-800 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-600"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>
          
          {/* BAGIAN PASSWORD DIPERBARUI */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-zinc-500" size={18} />
            <input
              // Ubah type berdasarkan state showPassword
              type={showPassword ? "text" : "password"} 
              placeholder="Password"
              // Ubah pr-4 jadi pr-10 agar teks tidak menabrak icon mata
              className="w-full bg-zinc-950 border border-zinc-800 text-white pl-10 pr-10 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-600"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
            
            {/* Tombol Toggle Mata */}
            <button
              type="button" // Penting: type button agar tidak submit form saat diklik
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-900/20"
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            {!loading && <ArrowRight size={18} />}
          </motion.button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full text-zinc-500 hover:text-white text-sm font-medium py-2 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Kembali ke Beranda
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800 flex items-start gap-3">
          <ShieldAlert className="text-yellow-500 shrink-0" size={18} />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Sistem dilindungi enkripsi Blockchain. IP Anda dicatat untuk keamanan.
          </p>
        </div>
        
      </motion.div>
    </div>
  );
}