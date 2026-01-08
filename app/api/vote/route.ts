// app/api/vote/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; 
import { Block, BlockData } from '@/lib/blockchain';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateId, candidateName } = body; // HAPUS 'userId' dari sini!

    // ---------------------------------------------------------
    // 1. KEAMANAN: AMBIL USER DARI SESSION (BUKAN DARI BODY)
    // ---------------------------------------------------------
    // Ini mencegah IDOR. Kita tanya ke Supabase: "Siapa yang request ini?"
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Silakan login terlebih dahulu.' }, { status: 401 });
    }

    // Jadikan ini sebagai ID mutlak
    const userId = user.id;

    // Cek kelengkapan data kandidat
    if (!candidateId || !candidateName) {
      return NextResponse.json({ error: 'Data kandidat tidak lengkap' }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 2. CEK ROLE USER (Agar Admin tidak bisa vote)
    // ---------------------------------------------------------
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role === 'admin') {
      return NextResponse.json({ 
        error: '⛔ AKSES DITOLAK: Admin tidak diperbolehkan memberikan suara.' 
      }, { status: 403 });
    }

    // ---------------------------------------------------------
    // 3. CEK DOUBLE VOTING
    // ---------------------------------------------------------
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      return NextResponse.json({ error: 'Anda sudah menggunakan hak suara Anda.' }, { status: 403 });
    }

    // ---------------------------------------------------------
    // 4. LOGIKA BLOCKCHAIN (Create Block)
    // ---------------------------------------------------------
    const { data: lastBlocks } = await supabase
      .from('blocks')
      .select('*')
      .order('index', { ascending: false })
      .limit(1);

    let previousHash = "0";
    let newIndex = 1;

    if (lastBlocks && lastBlocks.length > 0) {
      previousHash = lastBlocks[0].hash;
      newIndex = lastBlocks[0].index + 1;
    }

    const blockData: BlockData = {
      voter_id: userId, // ID ini sekarang dijamin User Asli
      candidate_id: candidateId,
      candidate_name: candidateName
    };

    const newBlock = new Block(newIndex, Date.now(), blockData, previousHash);

    // ---------------------------------------------------------
    // 5. SIMPAN KE DATABASE (Atomic Operations)
    // ---------------------------------------------------------
    
    // A. Simpan Blok ke Blockchain
    const { error: blockError } = await supabase
      .from('blocks')
      .insert({
        index: newBlock.index,
        timestamp: newBlock.timestamp,
        data: newBlock.data,
        previous_hash: newBlock.previousHash,
        hash: newBlock.hash,
        nonce: newBlock.nonce
      });

    if (blockError) throw new Error("Gagal menyimpan blok: " + blockError.message);

    // B. Simpan Bukti Vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({ user_id: userId, candidate_id: candidateId });

    if (voteError) throw new Error("Gagal menyimpan vote: " + voteError.message);

    // C. Update Counter Kandidat
    // Kita ambil data dulu untuk memastikan kandidat ada
    const { data: candidate } = await supabase
        .from('candidates')
        .select('vote_count')
        .eq('id', candidateId)
        .single();
        
    if (candidate) {
        await supabase
            .from('candidates')
            .update({ vote_count: candidate.vote_count + 1 })
            .eq('id', candidateId);
    }

    return NextResponse.json({ 
      message: 'Vote berhasil dicatat di Blockchain!', 
      blockHash: newBlock.hash 
    });

  } catch (error: any) {
    console.error("Voting Error:", error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}