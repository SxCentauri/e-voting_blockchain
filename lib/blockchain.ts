// lib/blockchain.ts
import SHA256 from 'crypto-js/sha256';

// Interface: Supaya data kita terstruktur rapi (Tipe Data)
export interface BlockData {
  voter_id: string;
  candidate_id: number;
  candidate_name: string;
}

export interface IBlock {
  index: number;
  timestamp: number;
  data: BlockData;
  previousHash: string;
  hash: string;
  nonce: number;
}

// CLASS 1: BLOCK
// Merepresentasikan satu kotak suara
export class Block implements IBlock {
  public index: number;
  public timestamp: number;
  public data: BlockData;
  public previousHash: string;
  public hash: string;
  public nonce: number;

  constructor(index: number, timestamp: number, data: BlockData, previousHash: string = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  // FUNGSI INFORMATIKA UTAMA: Hashing
  // Menggabungkan semua isi blok menjadi satu string acak unik
  calculateHash(): string {
    return SHA256(
      this.index +
      this.previousHash +
      this.timestamp +
      JSON.stringify(this.data) +
      this.nonce
    ).toString();
  }
}

// CLASS 2: BLOCKCHAIN
// Mengatur rantai dan validasi
export class Blockchain {
  public chain: Block[];

  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  // Blok pertama dalam sejarah (Wajib ada manual)
  createGenesisBlock(): Block {
    return new Block(0, Date.now(), { 
        voter_id: "system", 
        candidate_id: 0, 
        candidate_name: "GENESIS_BLOCK" 
    }, "0");
  }

  // Mengambil blok terakhir untuk melihat Hash-nya
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  // Menambah blok baru
  addBlock(newBlock: Block): void {
    // 1. Ambil hash dari blok sebelumnya, masukkan ke blok baru (Chaining)
    newBlock.previousHash = this.getLatestBlock().hash;
    
    // 2. Hitung Hash baru untuk blok ini
    newBlock.hash = newBlock.calculateHash();
    
    // 3. Masukkan ke rantai memori
    this.chain.push(newBlock);
  }

  // FUNGSI KEAMANAN: Cek apakah ada data yang dimanipulasi?
  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Cek 1: Apakah Hash blok ini masih valid sesuai isinya?
      // Jika data diubah sedikit saja, calculateHash() akan beda dengan hash yang tersimpan.
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      // Cek 2: Apakah blok ini benar menunjuk ke blok sebelumnya?
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}