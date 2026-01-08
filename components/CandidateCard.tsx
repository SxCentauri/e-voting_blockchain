// components/CandidateCard.tsx
'use client';

import { motion } from 'framer-motion';
import { Loader2, Vote, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface CandidateCardProps {
  id: number;
  name: string;
  vision: string;
  imageUrl: string;
  onVote: (id: number) => void;
  isVoting: boolean;
  hasVoted: boolean;
}

export default function CandidateCard({
  id,
  name,
  vision,
  imageUrl,
  onVote,
  isVoting,
  hasVoted
}: CandidateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all"
    >
      {/* Bagian Gambar */}
      <div className="relative h-56 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {imageUrl ? (
            // Menggunakan img tag biasa agar lebih fleksibel dengan url eksternal tanpa config next.config.js
            <img 
              src={imageUrl} 
              alt={name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
        ) : (
          // Placeholder jika tidak ada gambar (Inisial Nama)
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
            <span className="text-6xl font-bold text-zinc-300 dark:text-zinc-700 select-none">
              {name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Bagian Konten Teks */}
      <div className="p-6 flex flex-col flex-grow relative">
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 leading-tight">
          {name}
        </h3>
        
        <div className="h-px w-10 bg-blue-500 mb-4 rounded-full"></div>
        
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6 flex-grow">
          "{vision}"
        </p>

        {/* Tombol Action */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onVote(id)}
          disabled={isVoting || hasVoted}
          className={`
            w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden
            ${hasVoted 
              ? 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
              : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-lg shadow-zinc-500/20 hover:shadow-zinc-500/40'
            }
            ${isVoting ? 'opacity-80 cursor-wait pl-8' : ''}
          `}
        >
          {isVoting ? (
            <>
              <Loader2 className="animate-spin absolute left-1/2 -ml-[4.5rem]" size={18} />
              <span>Memproses Blok...</span>
            </>
          ) : hasVoted ? (
            <>
              <CheckCircle size={18} />
              Sudah Memilih
            </>
          ) : (
            <>
              <Vote size={18} />
              Beri Suara
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}