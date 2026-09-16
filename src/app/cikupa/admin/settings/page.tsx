'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  User, Mail, Camera, Save, Loader2, Lock, Eye, EyeOff, MessageSquare, 
  CreditCard, Plus, Trash2, Pencil, QrCode, Upload, Shield, CheckCircle,
  AlertTriangle, Info
} from 'lucide-react';
import Image from 'next/image';
import BranchBadge from '@/components/BranchBadge';

const BRANCH_ID = 'dlob-cikupa';
const ACCENT = '#10B981';

type BankAccount = { name: string; number: string };
type BankInfo = { holderName: string; banks: BankAccount[]; ewallets: BankAccount[] };

const DEFAULT_DLBC_BANK_INFO: BankInfo = {
  holderName: '',
  banks: [],
  ewallets: [],
};

export default function CikupaAdminSettingsPage() {
  const { user, updateProfile, uploadAvatar, refreshUser, updatePassword } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification toggles
  const [waEnabled, setWaEnabled] = useState<boolean | null>(null);
  const [waToggling, setWaToggling] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState<boolean | null>(null);
  const [emailToggling, setEmailToggling] = useState(false);

  // Bank accounts for DLBC
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [bankDraft, setBankDraft] = useState<BankInfo | null>(null);
  const [bankEditing, setBankEditing] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);

  // QRIS for DLBC
  const [qrisImageUrl, setQrisImageUrl] = useState<string>('');
  const [qrisUploading, setQrisUploading] = useState(false);
  const qrisInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/admin/app-settings', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      const settings: { key: string; value: string }[] = json.settings ?? [];

      // Query strictly DLBC-specific settings — completely independent from Pusat
      const wa = settings.find(s => s.key === `wa_notifications_${BRANCH_ID}`);
      const email = settings.find(s => s.key === `email_notifications_${BRANCH_ID}`);
      const bank = settings.find(s => s.key === `bank_accounts_${BRANCH_ID}`);
      const qris = settings.find(s => s.key === `qris_image_url_${BRANCH_ID}`);

      setWaEnabled(wa ? wa.value === 'true' : false);
      setEmailEnabled(email ? email.value === 'true' : true);
      setQrisImageUrl(qris?.value || '');

      if (bank?.value) {
        try {
          const parsed = JSON.parse(bank.value);
          setBankInfo(parsed);
          setBankDraft(parsed);
        } catch {
          setBankInfo(DEFAULT_DLBC_BANK_INFO);
          setBankDraft(DEFAULT_DLBC_BANK_INFO);
        }
      } else {
        setBankInfo(DEFAULT_DLBC_BANK_INFO);
        setBankDraft(DEFAULT_DLBC_BANK_INFO);
      }
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
    if (user?.user_metadata?.phone) {
      setPhone(user.user_metadata.phone);
    }
    if (user?.user_metadata?.avatar_url) {
      const urlWithTimestamp = user.user_metadata.avatar_url.includes('?') 
        ? user.user_metadata.avatar_url 
        : `${user.user_metadata.avatar_url}?t=${Date.now()}`;
      setAvatarUrl(urlWithTimestamp);
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File harus berupa gambar' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file maksimal 2MB' });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
      await refreshUser();
      setMessage({ type: 'success', text: 'Foto profil berhasil diperbarui!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal upload avatar' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);
    try {
      await updateProfile({ full_name: fullName, phone });
      await refreshUser();
      setMessage({ type: 'success', text: 'Profil DLBC berhasil disimpan!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan profil' });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Kata sandi minimal 6 karakter' });
      return;
    }

    setIsPasswordLoading(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Kata sandi berhasil diperbarui!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal update password' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleSaveBankInfo = async () => {
    if (!bankDraft) return;
    setBankSaving(true);
    try {
      const cleanDraft: BankInfo = {
        holderName: bankDraft.holderName?.trim() || '',
        banks: (bankDraft.banks || []).filter(b => b.name?.trim() && b.number?.trim()),
        ewallets: (bankDraft.ewallets || []).filter(e => e.name?.trim() && e.number?.trim()),
      };
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ key: `bank_accounts_${BRANCH_ID}`, value: JSON.stringify(cleanDraft) }),
      });
      if (res.ok) {
        setBankInfo(cleanDraft);
        setBankDraft(cleanDraft);
        setBankEditing(false);
        setMessage({ type: 'success', text: 'Rekening pembayaran DLBC berhasil disimpan!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Gagal menyimpan rekening');
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Gagal menyimpan' });
    } finally {
      setBankSaving(false);
    }
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file maksimal 5MB' });
      return;
    }

    setQrisUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `admin/qris_dlbc.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      const urlWithBust = `${publicUrl}?t=${Date.now()}`;
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ key: `qris_image_url_${BRANCH_ID}`, value: publicUrl }),
      });

      setQrisImageUrl(urlWithBust);
      setMessage({ type: 'success', text: 'QRIS DLBC berhasil diupload!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Gagal upload QRIS' });
    } finally {
      setQrisUploading(false);
      if (qrisInputRef.current) qrisInputRef.current.value = '';
    }
  };

  const handleRemoveQris = async () => {
    if (!confirm('Hapus gambar QRIS DLBC? Member DLBC tidak akan melihat QRIS saat checkout.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ key: `qris_image_url_${BRANCH_ID}`, value: '' }),
      });
      setQrisImageUrl('');
      setMessage({ type: 'success', text: 'QRIS DLBC berhasil dihapus.' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Gagal menghapus QRIS DLBC' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6" style={{ color: ACCENT }} />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Pengaturan Admin DLBC</h1>
            <BranchBadge size="sm" />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Kelola profil admin cabang Cikupa, rekening penerimaan dana khusus DLBC, dan notifikasi
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' 
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : null}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-white/10 p-6">
        <h2 className="text-base font-black text-gray-900 dark:text-white mb-4">Profil Admin</h2>
        
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 border-2 border-emerald-500/30">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{fullName || user?.email}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              Admin Cabang DLBC
            </span>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">Nomor WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isProfileLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {isProfileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Profil</span>
            </button>
          </div>
        </form>
      </div>

      {/* Bank & Payment Accounts for DLBC (Completely Isolated from DLOB Pusat) */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 dark:text-white">Rekening Pembayaran DLBC</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Khusus DLBC
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Rekening bank & e-wallet penerima pembayaran khusus untuk cabang DLBC Cikupa (berbeda dari DLOB Pusat)
            </p>
          </div>
          {!bankEditing ? (
            <button
              onClick={() => {
                setBankDraft({
                  holderName: bankInfo?.holderName || '',
                  banks: (bankInfo?.banks && bankInfo.banks.length > 0) ? [...bankInfo.banks] : [{ name: '', number: '' }],
                  ewallets: (bankInfo?.ewallets && bankInfo.ewallets.length > 0) ? [...bankInfo.ewallets] : [{ name: '', number: '' }],
                });
                setBankEditing(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Rekening</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setBankDraft(bankInfo);
                  setBankEditing(false);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800"
              >
                Batal
              </button>
              <button
                onClick={handleSaveBankInfo}
                disabled={bankSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                {bankSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Simpan</span>
              </button>
            </div>
          )}
        </div>

        {/* Bank Details Display / Edit */}
        {bankDraft && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">Nama Pemilik Rekening</label>
              {bankEditing ? (
                <input
                  type="text"
                  placeholder="Contoh: Edi / DLBC Cikupa"
                  value={bankDraft.holderName}
                  onChange={e => setBankDraft({ ...bankDraft, holderName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
                />
              ) : (
                <p className="text-xs font-bold text-gray-900 dark:text-white">{bankInfo?.holderName || 'Belum diisi'}</p>
              )}
            </div>

            {/* Bank List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-gray-700 dark:text-zinc-300">Bank Transfer DLBC:</p>
                {bankEditing && (
                  <button
                    type="button"
                    onClick={() => setBankDraft({
                      ...bankDraft,
                      banks: [...(bankDraft.banks || []), { name: '', number: '' }]
                    })}
                    className="text-xs text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Bank</span>
                  </button>
                )}
              </div>

              {bankEditing ? (
                <div className="space-y-2">
                  {(bankDraft.banks || []).map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nama Bank (BCA, Mandiri, dll)"
                        value={b.name}
                        onChange={e => {
                          const updated = [...bankDraft.banks];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setBankDraft({ ...bankDraft, banks: updated });
                        }}
                        className="w-1/3 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Nomor Rekening"
                        value={b.number}
                        onChange={e => {
                          const updated = [...bankDraft.banks];
                          updated[idx] = { ...updated[idx], number: e.target.value };
                          setBankDraft({ ...bankDraft, banks: updated });
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = bankDraft.banks.filter((_, i) => i !== idx);
                          setBankDraft({ ...bankDraft, banks: updated });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(bankInfo?.banks || []).filter(b => b.number && b.number !== '—').length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">Belum ada rekening bank dikonfigurasi</p>
                  ) : (
                    (bankInfo?.banks || []).filter(b => b.number && b.number !== '—').map((b, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{b.name}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">{b.number}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* E-Wallet List */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-gray-700 dark:text-zinc-300">E-Wallet DLBC:</p>
                {bankEditing && (
                  <button
                    type="button"
                    onClick={() => setBankDraft({
                      ...bankDraft,
                      ewallets: [...(bankDraft.ewallets || []), { name: '', number: '' }]
                    })}
                    className="text-xs text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah E-Wallet</span>
                  </button>
                )}
              </div>

              {bankEditing ? (
                <div className="space-y-2">
                  {(bankDraft.ewallets || []).map((eWallet, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nama E-Wallet (DANA, Gopay, OVO)"
                        value={eWallet.name}
                        onChange={e => {
                          const updated = [...(bankDraft.ewallets || [])];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setBankDraft({ ...bankDraft, ewallets: updated });
                        }}
                        className="w-1/3 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Nomor E-Wallet"
                        value={eWallet.number}
                        onChange={e => {
                          const updated = [...(bankDraft.ewallets || [])];
                          updated[idx] = { ...updated[idx], number: e.target.value };
                          setBankDraft({ ...bankDraft, ewallets: updated });
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (bankDraft.ewallets || []).filter((_, i) => i !== idx);
                          setBankDraft({ ...bankDraft, ewallets: updated });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(bankInfo?.ewallets || []).filter(e => e.number && e.number !== '—').length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">Belum ada e-wallet dikonfigurasi</p>
                  ) : (
                    (bankInfo?.ewallets || []).filter(e => e.number && e.number !== '—').map((eWallet, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{eWallet.name}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">{eWallet.number}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* QRIS Upload for DLBC */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Metode QRIS DLBC Cikupa</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                  qrisImageUrl 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' 
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                }`}>
                  {qrisImageUrl ? '✅ QRIS Aktif' : '⚠️ Belum Dikonfigurasi'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Kelola barcode QRIS pembayaran khusus untuk cabang DLBC Cikupa
              </p>
            </div>
          </div>

          {/* Status Notice Banner */}
          {!qrisImageUrl ? (
            <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <p className="font-extrabold mb-0.5">QRIS DLBC Cikupa Belum Dikonfigurasi</p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Metode pembayaran QRIS belum aktif untuk cabang DLBC Cikupa. Member saat ini melakukan pembayaran melalui <strong>Transfer Bank</strong> atau <strong>Tunai (Kasir)</strong>. Upload gambar barcode QRIS cabang Cikupa di bawah ini jika ingin mengaktifkannya.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <p className="font-extrabold mb-0.5">QRIS DLBC Cikupa Siap Digunakan</p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Barcode QRIS aktif dan dapat dipindai oleh member DLBC Cikupa saat melakukan pembayaran di dashboard.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-white/5">
            {qrisImageUrl ? (
              <div className="w-28 h-28 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 p-1.5 bg-white shadow-xs shrink-0">
                <Image src={qrisImageUrl} alt="QRIS DLBC" width={112} height={112} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col items-center justify-center text-amber-500 shrink-0">
                <QrCode className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-bold">Kosong</span>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => qrisInputRef.current?.click()}
                  disabled={qrisUploading}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: ACCENT }}
                >
                  {qrisUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{qrisImageUrl ? 'Ganti Barcode QRIS DLBC' : 'Upload Barcode QRIS DLBC'}</span>
                </button>
                {qrisImageUrl && (
                  <button
                    onClick={handleRemoveQris}
                    className="px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-bold flex items-center gap-1 border border-red-200 dark:border-red-900/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus QRIS</span>
                  </button>
                )}
              </div>
              <input ref={qrisInputRef} type="file" accept="image/*" onChange={handleQrisUpload} className="hidden" />
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                Upload gambar barcode QRIS khusus cabang Cikupa (Format PNG/JPG, maksimal 5MB).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-white/10 p-6">
        <h2 className="text-base font-black text-gray-900 dark:text-white mb-4">Ganti Kata Sandi</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">Kata Sandi Baru</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">Konfirmasi Kata Sandi</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPasswordLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50"
            style={{ backgroundColor: ACCENT }}
          >
            {isPasswordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Perbarui Kata Sandi</span>
          </button>
        </form>
      </div>
    </div>
  );
}
