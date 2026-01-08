// app/api/audit/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Block } from '@/lib/blockchain';

// Wajib: Agar browser tidak menyimpan cache (selalu cek real-time)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. AMBIL SEMUA DATA (Blockchain & Database)
    const { data: blocks } = await supabase
      .from('blocks')
      .select('*')
      .order('index', { ascending: true });

    if (!blocks || blocks.length === 0) {
      return NextResponse.json({ message: 'Blockchain kosong (Belum ada suara masuk).' });
    }

    const { data: votes } = await supabase
      .from('votes')
      .select('*');

    // Array untuk menampung daftar kejahatan/error yang ditemukan
    const auditReport: any[] = [];
    let isChainValid = true;

    // 2. MULAI AUDIT (Looping dari Blok ke-1, lewati Genesis Blok ke-0)
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      // --- LAPIS 1: CEK INTEGRITAS DATA (Apakah Blok Diedit?) ---
      // Kita buat ulang objek blok dari data database untuk dihitung ulang
      const testBlock = new Block(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.data, // Data vote (JSON)
        currentBlock.previous_hash
      );
      testBlock.nonce = currentBlock.nonce; // Nonce harus sama persis

      // Hitung ulang Hash saat ini
      const recalculatedHash = testBlock.calculateHash();

      if (recalculatedHash !== currentBlock.hash) {
        isChainValid = false;
        auditReport.push({
          level: 'CRITICAL',
          type: 'DATA_TAMPERING',
          block_index: currentBlock.index,
          message: 'Isi Data Blok telah diubah! Hash tidak cocok.',
          details: {
            stored_hash: currentBlock.hash,
            recalculated_hash: recalculatedHash
          }
        });
      }

      // --- LAPIS 2: CEK KESINAMBUNGAN RANTAI (Apakah Rantai Putus?) ---
      if (currentBlock.previous_hash !== previousBlock.hash) {
        isChainValid = false;
        auditReport.push({
          level: 'CRITICAL',
          type: 'BROKEN_CHAIN',
          block_index: currentBlock.index,
          message: 'Rantai Blok Putus! Previous Hash tidak mengarah ke Hash blok sebelumnya.',
          details: {
            current_block_prev_hash: currentBlock.previous_hash,
            actual_previous_block_hash: previousBlock.hash
          }
        });
      }

      // --- LAPIS 3: CEK KONSISTENSI DATABASE (Blockchain vs Tabel Votes) ---
      // FIX ERROR DISINI: Tambahkan type ': any = null'
      let blockVoteData: any = null;
      
      try {
        blockVoteData = typeof currentBlock.data === 'string' 
          ? JSON.parse(currentBlock.data) 
          : currentBlock.data;
      } catch (e) {
        blockVoteData = null;
      }

      if (blockVoteData && votes) {
        // Cari vote di tabel SQL yang voter_id-nya sama dengan di Blok ini
        const sqlVote = votes.find((v: any) => v.user_id === blockVoteData.voter_id);

        if (!sqlVote) {
          // Kasus: Ada di Blockchain, tapi HILANG di Database
          auditReport.push({
            level: 'WARNING',
            type: 'MISSING_DATA',
            block_index: currentBlock.index,
            message: 'Data suara ditemukan di Blockchain tetapi HILANG di tabel votes (Database).',
            voter_id: blockVoteData.voter_id
          });
        } else {
          // Kasus: Pilihan Kandidat Berbeda (Manipulasi SQL)
          // Kita pakai String() agar aman (misal "1" vs 1 dianggap sama)
          if (String(sqlVote.candidate_id) !== String(blockVoteData.candidate_id)) {
            auditReport.push({
              level: 'HIGH',
              type: 'INCONSISTENT_DATA',
              block_index: currentBlock.index,
              message: 'Manipulasi Suara Terdeteksi! Pilihan di Database berbeda dengan Blockchain.',
              details: {
                voter_id: blockVoteData.voter_id,
                blockchain_choice: `Kandidat ID ${blockVoteData.candidate_id}`,
                database_choice: `Kandidat ID ${sqlVote.candidate_id}`
              }
            });
          }
        }
      }
    }

    // 3. KESIMPULAN AKHIR
    if (auditReport.length > 0) {
      // Jika ditemukan masalah
      return NextResponse.json({
        status: '❌ DANGER: SYSTEM COMPROMISED',
        message: 'Ditemukan pelanggaran integritas data pada sistem.',
        total_errors: auditReport.length,
        report: auditReport
      }, { status: 418 }); // 418 I'm a teapot (atau 409 Conflict)
    }

    // Jika bersih
    return NextResponse.json({
      status: '✅ SECURE',
      message: 'Sistem Aman. Seluruh data Blockchain valid, rantai tersambung, dan konsisten dengan database.',
      total_blocks_verified: blocks.length,
      last_block_hash: blocks[blocks.length - 1].hash
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'ERROR', 
      message: error.message 
    }, { status: 500 });
  }
}