// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
// Import Icon (Ditambah Menu & ChevronRight untuk Mobile)
import { 
  ShieldCheck, LogOut, LayoutGrid, Plus, Trash2, Users, Trophy, 
  Loader2, ImagePlus, X, Save, Menu, ChevronRight, User
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner'; 
import { motion, AnimatePresence } from 'framer-motion';

// Tipe Data Kandidat
type Candidate = {
  id: number;
  name: string;
  vision: string;
  image_url: string;
  vote_count: number;
};

export default function AdminPage() {
  const router = useRouter();
  
  // --- STATE ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // State untuk Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  // State Input Form
  const [name, setName] = useState('');
  const [vision, setVision] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. AUTH & INIT ---
  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    setAdminEmail(user.email || 'Admin');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      toast.error("⛔ AKSES DITOLAK: Halaman ini khusus Admin.");
      router.push('/');
    } else {
      setIsAdmin(true);
      fetchCandidates();
    }
    setLoadingAuth(false);
  }

  // --- 2. CRUD OPERATIONS ---
  async function fetchCandidates() {
    const { data } = await supabase
      .from('candidates')
      .select('*')
      .order('vote_count', { ascending: false });
    if (data) setCandidates(data);
  }

  async function handleDelete(id: number, candidateName: string) {
    toast.promise(
      async () => {
        await supabase.from('votes').delete().eq('candidate_id', id);
        const { error, data } = await supabase.from('candidates').delete().eq('id', id).select();
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) throw new Error("Gagal menghapus data.");
        return "Berhasil";
      },
      {
        loading: `Menghapus ${candidateName}...`,
        success: () => {
           fetchCandidates();
           return `✅ Kandidat ${candidateName} telah dihapus.`;
        },
        error: (err) => `❌ Gagal: ${err.message}`,
      }
    );
  }

  async function handleAddCandidate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !vision.trim()) {
      toast.warning("Mohon lengkapi nama dan visi misi.");
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading("Mengupload data...");

    try {
      let finalImageUrl = "";
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('candidate-images').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('candidate-images').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }

      const { error } = await supabase.from('candidates').insert({
        name, vision, image_url: finalImageUrl, vote_count: 0
      });

      if (error) throw error;

      toast.success('🎉 Kandidat baru berhasil ditambahkan!', { id: toastId });
      setName(''); setVision(''); setImageFile(null); setPreviewUrl(null);
      setShowAddForm(false);
      fetchCandidates();

    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("Ukuran file max 2MB.");
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  if (loadingAuth) return <div className="h-screen flex items-center justify-center bg-zinc-950 text-blue-500"><Loader2 className="animate-spin" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      
      {/* --- NAVBAR RESPONSIVE --- */}
      <nav className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* Logo */}
            <div className="flex items-center gap-2 font-bold text-lg sm:text-xl">
              <div className="bg-blue-600/20 p-1.5 sm:p-2 rounded-lg text-blue-500 border border-blue-500/20">
                <ShieldCheck size={20} className="sm:w-6 sm:h-6" />
              </div>
              <span>Admin<span className="text-blue-500">Panel</span></span>
            </div>
            
            {/* DESKTOP MENU (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 mr-2 text-sm text-zinc-400 border-r border-zinc-800 pr-4">
                 <User size={16} />
                 <span>{adminEmail}</span>
              </div>
              <button 
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-sm font-medium bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-full hover:text-white hover:border-zinc-600 transition"
              >
                <LayoutGrid size={16} /> Live Site
              </button>
              <button 
                onClick={() => { supabase.auth.signOut(); router.push('/login'); }}
                className="flex items-center gap-2 text-sm font-medium bg-red-500/10 text-red-500 px-4 py-2 rounded-full hover:bg-red-600 hover:text-white transition border border-red-500/20"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-zinc-800 bg-zinc-950 overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* Info Admin */}
                <div className="flex items-center gap-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-500">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase text-zinc-500">Administrator</span>
                      <span className="text-sm font-medium truncate text-white">{adminEmail}</span>
                    </div>
                </div>

                {/* Navigasi Mobile */}
                <button 
                  onClick={() => router.push('/')}
                  className="w-full flex items-center justify-between bg-zinc-900 text-zinc-300 hover:text-white p-3 rounded-xl font-medium border border-zinc-800 transition active:scale-95"
                >
                  <span className="flex items-center gap-2"><LayoutGrid size={18} /> Lihat Live Voting</span>
                  <ChevronRight size={16} className="text-zinc-500"/>
                </button>
                
                <button 
                  onClick={() => { supabase.auth.signOut(); router.push('/login'); }}
                  className="w-full flex items-center justify-between bg-red-900/20 text-red-500 p-3 rounded-xl font-medium border border-red-500/20 transition hover:bg-red-900/30 active:scale-95"
                >
                  <span className="flex items-center gap-2"><LogOut size={18} /> Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        
        {/* HEADER & ACTION BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white flex items-center gap-2">
              Manajemen Kandidat
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Pantau suara realtime dan kelola daftar calon.
            </p>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-lg text-sm
              ${showAddForm 
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
              }`}
          >
            {showAddForm ? <X size={18}/> : <Plus size={18}/>}
            {showAddForm ? 'Tutup Form' : 'Tambah Baru'}
          </motion.button>
        </div>

        {/* FORM TAMBAH KANDIDAT */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="overflow-hidden"
            >
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 sm:p-8 max-w-4xl mx-auto shadow-2xl relative mt-4 backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-zinc-100">
                  <span className="bg-blue-500/10 text-blue-400 p-1.5 rounded-md"><Plus size={18}/></span> 
                  Input Data Calon
                </h2>
                
                <form onSubmit={handleAddCandidate} className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4 order-2 md:order-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Foto Profil</label>
                    <div className="border-2 border-dashed border-zinc-700 rounded-xl aspect-square flex flex-col items-center justify-center bg-zinc-950/50 hover:bg-zinc-900 transition relative overflow-hidden group cursor-pointer">
                      {previewUrl ? (
                        <>
                          <Image src={previewUrl} alt="Preview" fill className="object-cover rounded-lg" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <button type="button" onClick={() => {setImageFile(null); setPreviewUrl(null)}} className="bg-red-600 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition">
                                <X size={20}/>
                              </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          <div className="bg-zinc-800 p-4 rounded-full mb-3 text-zinc-400 group-hover:text-blue-400 transition">
                             <ImagePlus size={32} />
                          </div>
                          <p className="text-sm text-zinc-400 font-medium">Upload Foto (Opsional)</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-5 flex flex-col justify-center order-1 md:order-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 block">Nama Lengkap <span className="text-red-500">*</span></label>
                      <input 
                        type="text" required value={name} onChange={e=>setName(e.target.value)} 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-4 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-zinc-700" 
                        placeholder="Nama Kandidat"
                      />
                    </div>
                    <div className="flex-grow">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 block">Visi & Misi <span className="text-red-500">*</span></label>
                      <textarea 
                        required rows={5} value={vision} onChange={e=>setVision(e.target.value)}
                        className="w-full h-32 sm:h-auto bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-4 text-white focus:ring-2 focus:ring-blue-600 outline-none resize-none transition-all placeholder:text-zinc-700" 
                        placeholder="Deskripsi singkat visi misi..."
                      />
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:opacity-50 text-white font-bold py-3 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 mt-2"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20}/>} 
                      {isSubmitting ? 'Memproses...' : 'Simpan Kandidat'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LIST KANDIDAT */}
        <div className="mt-8">
           {candidates.length > 0 && (
             <div className="flex items-center gap-2 mb-4 text-zinc-400 text-sm px-1">
                <Users size={16} /> Total Kandidat Aktif: <span className="text-white font-bold">{candidates.length}</span>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {candidates.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 flex flex-col items-center justify-center">
                <p className="text-zinc-500">Database Kandidat Kosong</p>
              </div>
            ) : (
              candidates.map((c, index) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  key={c.id} 
                  className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all flex flex-col relative shadow-sm hover:shadow-2xl"
                >
                  {index === 0 && (
                     <div className="absolute top-3 left-3 z-20 bg-yellow-500 text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 shadow-lg">
                        <Trophy size={12} fill="black"/> Leader
                     </div>
                  )}

                  <button 
                    onClick={() => handleDelete(c.id, c.name)}
                    className="absolute top-3 right-3 z-20 bg-red-600/80 md:opacity-0 group-hover:opacity-100 text-white p-2 rounded-xl transition-all shadow-lg hover:bg-red-600 hover:scale-110 backdrop-blur-sm"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="h-48 sm:h-56 bg-zinc-800 relative overflow-hidden">
                    {c.image_url ? (
                      <Image src={c.image_url} alt={c.name} fill className="object-cover opacity-90 group-hover:opacity-100 transition duration-700" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-700 font-bold text-5xl bg-zinc-800">{c.name.charAt(0)}</div>
                    )}
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent p-4 sm:p-6 pt-12">
                      <p className="text-zinc-400 text-xs font-mono uppercase mb-1">Perolehan Suara</p>
                      <div className="flex items-center gap-2 text-white font-mono text-2xl sm:text-3xl font-bold tracking-tighter">
                         <span className="text-blue-500 animate-pulse">●</span> {c.vote_count}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 flex-grow flex flex-col bg-zinc-900/50">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 truncate">{c.name}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 mb-4 flex-grow">{c.vision}</p>
                    <div className="pt-4 border-t border-zinc-800/50 flex justify-between items-center text-xs text-zinc-500 font-mono">
                      <span>ID: #{c.id}</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}