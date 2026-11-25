# DLOB Community Development Guidelines

## Aturan Sinkronisasi Knowledge Base & DLOB AI
Setiap kali ada penambahan atau perubahan fitur, aturan biaya, atau alur kerja di platform:
1. **Perbarui Knowledge Base Komunitas**:
   - `src/lib/dlob-knowledge.ts` (meliputi `DLOB_KNOWLEDGE_BASE`, `DLOB_ADMIN_KNOWLEDGE_BASE`, dan `DLOB_MEMBER_KNOWLEDGE_BASE`).
   - Wajib mencakup kedua komunitas secara lengkap dan jelas:
     - **DLOB Pusat** (GOR Wisma Harapan, Tangerang Kota - Sabtu malam)
     - **DLBC Cikupa** (GOR Galaxi Cikupa - Jumat malam)
2. **Perbarui AI Chatbot & Agent**:
   - `src/app/api/ai-chat/route.ts` (public chatbot prompt & knowledge).
   - `src/app/api/ai/dlob-agent/route.ts` (Dlob Agent prompt untuk member & admin).
