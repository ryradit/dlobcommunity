'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Loader2, CheckCircle, XCircle, AlertCircle, ChevronDown, Save, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSaturdaysInMonth } from '@/lib/weeksCalculation';

interface MatchData {
  team1_player1: string;
  team1_player2: string;
  team2_player1: string;
  team2_player2: string;
  court_number: string;
  shuttlecock_amount: string;
  confidence: number;
}

interface ExtractedResponse {
  matches: MatchData[];
  total_matches: number;
  confidence: number;
}

interface MemberSuggestion {
  id: string;
  name: string;
  email: string;
  similarity: number;
}

interface ValidationState {
  isExactMatch: boolean;
  suggestions: MemberSuggestion[];
}

type PlayerField = 'team1_player1' | 'team1_player2' | 'team2_player1' | 'team2_player2';

type PlayerValidation = {
  [matchIndex: number]: {
    [K in PlayerField]?: ValidationState;
  };
};

export default function MatchImageExtractionPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [playerValidation, setPlayerValidation] = useState<PlayerValidation>({});
  const [showSuggestions, setShowSuggestions] = useState<{[key: string]: boolean}>({});
  const [matchDate, setMatchDate] = useState<string>('');
  const [creatingPlayer, setCreatingPlayer] = useState<{[key: string]: boolean}>({});
  const [notifStatus, setNotifStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [notifSummary, setNotifSummary] = useState<string>('');

  // Membership payment states
  const [membershipPayers, setMembershipPayers] = useState<Set<string>>(new Set());
  const [existingMemberships, setExistingMemberships] = useState<Set<string>>(new Set());
  const [membershipFee, setMembershipFee] = useState<number>(0);
  const [weeksInMonth, setWeeksInMonth] = useState<number>(4);
  const [loadingMemberships, setLoadingMemberships] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to parse date string as local date (not UTC)
  const getLocalDateFromString = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  // Get unique validated (exact-match) player names from current extracted data
  const getUniquePlayers = (): string[] => {
    if (!extractedData) return [];
    const names = new Set<string>();
    const fields: PlayerField[] = ['team1_player1', 'team1_player2', 'team2_player1', 'team2_player2'];
    extractedData.matches.forEach((match, i) => {
      fields.forEach(f => {
        const name = match[f]?.trim();
        const isExact = playerValidation[i]?.[f]?.isExactMatch;
        if (name && isExact) names.add(name);
      });
    });
    return Array.from(names).sort();
  };

  // Fetch existing memberships for the match month when date changes
  useEffect(() => {
    if (!matchDate) {
      setExistingMemberships(new Set());
      setMembershipPayers(new Set());
      setMembershipFee(0);
      return;
    }
    const date = getLocalDateFromString(matchDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const weeks = getSaturdaysInMonth(date);
    const fee = weeks >= 5 ? 45000 : 40000;
    setWeeksInMonth(weeks);
    setMembershipFee(fee);

    setLoadingMemberships(true);
    supabase
      .from('memberships')
      .select('member_name')
      .eq('month', month)
      .eq('year', year)
      .eq('payment_status', 'paid')
      .then(({ data }) => {
        const paid = new Set((data || []).map((m: { member_name: string }) => m.member_name));
        setExistingMemberships(paid);
        // Reset payers selection when date changes
        setMembershipPayers(new Set());
        setLoadingMemberships(false);
      });
  }, [matchDate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setExtractedData(null);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setExtractedData(null);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const processWithGemini = async (imageBase64: string) => {
    setCurrentStep('Memproses dengan Gemini AI Vision...');
    
    const response = await fetch('/api/ai/match-extraction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const data = await response.json();
      const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
      throw new Error(errorMsg || 'Gagal memproses dengan Gemini');
    }

    const data = await response.json();
    return data.data;
  };

  const handleProcess = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError('');
    setExtractedData(null);
    setPlayerValidation({});
    setCurrentStep('');

    try {
      const structured = await processWithGemini(selectedImage);
      setExtractedData(structured);
      setCurrentStep('Selesai!');
      
      // Auto-validate all player names
      await validateAllPlayers(structured.matches);
    } catch (err) {
      console.error('Processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Gagal memproses gambar';
      setError(errorMessage);
      setCurrentStep('');
    } finally {
      setIsProcessing(false);
    }
  };

  const validatePlayerName = async (name: string): Promise<ValidationState | null> => {
    if (!name || name.trim() === '') return null;
    
    try {
      const response = await fetch('/api/members/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        isExactMatch: data.isExactMatch,
        suggestions: data.suggestions || [],
      };
    } catch (error) {
      console.error('Validation error:', error);
      return null;
    }
  };

  const validateAllPlayers = async (matches: MatchData[]) => {
    const validationResults: PlayerValidation = {};
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      validationResults[i] = {};
      
      // Validate all 4 players
      const playerFields: PlayerField[] = ['team1_player1', 'team1_player2', 'team2_player1', 'team2_player2'];
      
      for (const playerKey of playerFields) {
        const playerName = match[playerKey];
        if (playerName && playerName.trim()) {
          const validation = await validatePlayerName(playerName);
          if (validation) {
            validationResults[i][playerKey] = validation;
          }
        }
      }
    }
    
    setPlayerValidation(validationResults);
  };

  const applySuggestion = (matchIndex: number, field: PlayerField, suggestion: MemberSuggestion) => {
    if (extractedData && extractedData.matches[matchIndex]) {
      const updatedMatches = [...extractedData.matches];
      updatedMatches[matchIndex] = { ...updatedMatches[matchIndex], [field]: suggestion.name };
      setExtractedData({ ...extractedData, matches: updatedMatches });
      
      // Update validation to exact match
      setPlayerValidation(prev => ({
        ...prev,
        [matchIndex]: {
          ...prev[matchIndex],
          [field]: {
            isExactMatch: true,
            suggestions: [],
          },
        },
      }));
      
      // Hide suggestions dropdown
      setShowSuggestions(prev => ({
        ...prev,
        [`${matchIndex}-${field}`]: false,
      }));
    }
  };

  const handleFieldChange = async (matchIndex: number, field: keyof MatchData, value: string | number) => {
    if (extractedData && extractedData.matches[matchIndex]) {
      const updatedMatches = [...extractedData.matches];
      updatedMatches[matchIndex] = { ...updatedMatches[matchIndex], [field]: value };
      setExtractedData({ ...extractedData, matches: updatedMatches });
      
      // Re-validate player name if it's a player field
      const playerFields: PlayerField[] = ['team1_player1', 'team1_player2', 'team2_player1', 'team2_player2'];
      if (typeof value === 'string' && playerFields.includes(field as PlayerField)) {
        const validation = await validatePlayerName(value);
        if (validation) {
          setPlayerValidation(prev => ({
            ...prev,
            [matchIndex]: {
              ...prev[matchIndex],
              [field as PlayerField]: validation,
            },
          }));
        }
      }
    }
  };

  const handleDeleteMatch = (index: number) => {
    if (extractedData) {
      const updatedMatches = extractedData.matches.filter((_, i) => i !== index);
      setExtractedData({
        ...extractedData,
        matches: updatedMatches,
        total_matches: updatedMatches.length
      });
    }
  };

  const getValidationSummary = () => {
    let exactMatches = 0;
    let withSuggestions = 0;
    let noMatches = 0;
    
    Object.values(playerValidation).forEach(matchValidation => {
      Object.values(matchValidation).forEach(validation => {
        if (validation.isExactMatch) {
          exactMatches++;
        } else if (validation.suggestions.length > 0) {
          withSuggestions++;
        } else {
          noMatches++;
        }
      });
    });
    
    return { exactMatches, withSuggestions, noMatches };
  };

  const handleSaveAllMatches = async () => {
    if (!extractedData || extractedData.matches.length === 0) {
      alert('Tidak ada pertandingan untuk disimpan');
      return;
    }

    if (!matchDate) {
      alert('Harap pilih tanggal pertandingan terlebih dahulu');
      return;
    }

    const selectedDate = getLocalDateFromString(matchDate);

    // Check if date is in next month and needs confirmation
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    
    const monthDiff = (selectedYear - currentYear) * 12 + (selectedMonth - currentMonth);
    
    if (monthDiff > 0) {
      const confirmed = confirm(
        `Anda akan membuat ${extractedData.matches.length} pertandingan untuk ${selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} (bulan depan).\n\nApakah Anda yakin ingin melanjutkan?`
      );
      if (!confirmed) {
        return; // User cancelled
      }
    }

    setIsSaving(true);
    setError('');

    try {
      // --- Create membership payments first (if any selected) ---
      if (membershipPayers.size > 0) {
        const date = getLocalDateFromString(matchDate);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const membershipInserts = Array.from(membershipPayers).map(name => ({
          member_name: name,
          month,
          year,
          weeks_in_month: weeksInMonth,
          amount: membershipFee,
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        }));
        const { error: membershipError } = await supabase
          .from('memberships')
          .upsert(membershipInserts, { onConflict: 'member_name,month,year', ignoreDuplicates: false });
        if (membershipError) {
          console.error('[Membership] Insert error:', membershipError);
          // Non-fatal — proceed anyway but warn
          alert(`⚠️ Gagal menyimpan ${membershipPayers.size} pembayaran membership: ${membershipError.message}\n\nPertandingan tetap akan disimpan.`);
        } else {
          console.log(`[Membership] ✅ Saved ${membershipPayers.size} membership payments`);
        }
      }

      const response = await fetch('/api/matches/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matches: extractedData.matches,
          matchDate: matchDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan pertandingan');
      }

      setIsSaving(false);

      if (data.successCount > 0) {
        let message = `Berhasil menyimpan ${data.successCount} pertandingan!`;
        
        if (data.errorCount > 0) {
          message += `\n\nGagal: ${data.errorCount} pertandingan`;
          if (data.errors && data.errors.length > 0) {
            message += '\n\nDetail error:\n' + data.errors.slice(0, 5).join('\n');
            if (data.errors.length > 5) {
              message += `\n... dan ${data.errors.length - 5} error lainnya`;
            }
          }
        }
        
        alert(message);
        
        // --- Send grouped WA + email notifications ---
        const summary = data.memberSummary as Array<{
          name: string; phone: string | null; email: string | null;
          matchCount: number; totalAmountDue: number; totalAttendanceFee: number;
          hasMembership: boolean; isPaymentExempt: boolean;
        }>;

        console.log('[Notif] memberSummary from bulk-create:', JSON.stringify(summary));

        if (summary && summary.length > 0) {
          setNotifStatus('sending');

          const buildMember = (s: typeof summary[0]) => ({
            name: s.name,
            phone: s.phone || '',
            email: s.email || '',
            amountDue: s.matchCount > 0 ? Math.round(s.totalAmountDue / s.matchCount) : 0,
            attendanceFee: s.totalAttendanceFee,
            hasMembership: s.hasMembership,
            isPaymentExempt: s.isPaymentExempt,
            matchCount: s.matchCount,
            totalAmountDue: s.totalAmountDue,
            membershipJustPaid: membershipPayers.has(s.name),
            membershipAmount: membershipPayers.has(s.name) ? membershipFee : undefined,
          });

          const waMembers = summary.filter(s => s.phone && s.phone.trim()).map(buildMember);
          console.log('[Notif] waMembers count:', waMembers.length, waMembers.map(m => `${m.name}:${m.phone}`));
          const emailMembers = summary
            .filter(s => s.email && !s.email.endsWith('@temp.dlob.local'))
            .map(buildMember);

          const [waRes, emailRes] = await Promise.allSettled([
            waMembers.length > 0
              ? fetch('/api/send-wa-notification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ matchDate, members: waMembers, quickSend: true }),
                }).then(r => r.json())
              : Promise.resolve({ summary: { sent: 0, failed: 0, skipped: 0 } }),
            emailMembers.length > 0
              ? fetch('/api/send-match-notification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ matchDate, members: emailMembers }),
                }).then(r => r.json())
              : Promise.resolve({ summary: { sent: 0, failed: 0, skipped: 0 } }),
          ]);

          const waSummary = waRes.status === 'fulfilled' ? waRes.value?.summary : null;
          const mailSummary = emailRes.status === 'fulfilled' ? emailRes.value?.summary : null;

          if (waRes.status === 'rejected') console.error('[WA notif failed]', waRes.reason);
          if (emailRes.status === 'rejected') console.error('[Email notif failed]', emailRes.reason);

          const parts: string[] = [];
          if (waSummary) parts.push(`WA: ${waSummary.sent} terkirim${waSummary.failed > 0 ? `, ${waSummary.failed} gagal` : ''}`);
          if (mailSummary) parts.push(`Email: ${mailSummary.sent} terkirim${mailSummary.failed > 0 ? `, ${mailSummary.failed} gagal` : ''}`);
          setNotifSummary(parts.join(' · ') || 'Notifikasi dikirim');
          setNotifStatus('done');
        }
        
        // Reset form
        setExtractedData(null);
        setSelectedImage(null);
        setMatchDate('');
        setPlayerValidation({});
        setMembershipPayers(new Set());
        setExistingMemberships(new Set());
      } else {
        let errorMessage = 'Gagal menyimpan semua pertandingan.';
        if (data.errors && data.errors.length > 0) {
          errorMessage += '\n\n' + data.errors.slice(0, 5).join('\n');
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Save error:', error);
      setError(error instanceof Error ? error.message : 'Gagal menyimpan pertandingan');
      setIsSaving(false);
    }
  };

  const createTempPlayerAccount = async (matchIndex: number, field: PlayerField, name: string) => {
    if (!name.trim()) return;
    const key = `${matchIndex}-${field}`;
    setCreatingPlayer(prev => ({ ...prev, [key]: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/create-temp-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ full_name: name.trim() }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      // Mark as exact match now
      setPlayerValidation(prev => ({
        ...prev,
        [matchIndex]: {
          ...prev[matchIndex],
          [field]: { isExactMatch: true, suggestions: [] },
        },
      }));
    } finally {
      setCreatingPlayer(prev => ({ ...prev, [key]: false }));
    }
  };

  const getValidationIcon = (matchIndex: number, field: PlayerField) => {
    const validation = playerValidation[matchIndex]?.[field];
    if (!validation) return null;
    
    if (validation.isExactMatch) {
      return <CheckCircle className="text-green-400" size={16} />;
    } else if (validation.suggestions.length > 0) {
      return <AlertCircle className="text-yellow-400" size={16} />;
    } else {
      return <XCircle className="text-red-400" size={16} />;
    }
  };

  const getInputBorderClass = (matchIndex: number, field: PlayerField) => {
    const validation = playerValidation[matchIndex]?.[field];
    if (!validation) return 'border-white/10';
    
    if (validation.isExactMatch) {
      return 'border-green-400/50';
    } else if (validation.suggestions.length > 0) {
      return 'border-yellow-400/50';
    } else {
      return 'border-red-400/50';
    }
  };

  const renderPlayerInput = (
    matchIndex: number,
    field: PlayerField,
    value: string,
    placeholder: string
  ) => {
    const validation = playerValidation[matchIndex]?.[field];
    const suggestionKey = `${matchIndex}-${field}`;
    const hasSuggestions = validation && validation.suggestions.length > 0;
    
    return (
      <div className="relative mb-1">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => handleFieldChange(matchIndex, field, e.target.value)}
            placeholder={placeholder}
            className={`w-full bg-white/5 border ${getInputBorderClass(matchIndex, field)} rounded px-2 py-1 text-sm text-white placeholder-purple-300 pr-8`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {getValidationIcon(matchIndex, field)}
            {hasSuggestions && (
              <button
                onClick={() => setShowSuggestions(prev => ({
                  ...prev,
                  [suggestionKey]: !prev[suggestionKey]
                }))}
                className="text-yellow-400 hover:text-yellow-300"
              >
                <ChevronDown size={14} />
              </button>
            )}
          </div>
        </div>
        
        {/* No match or unresolved — offer to create temp account */}
        {validation && !validation.isExactMatch && value.trim() && (
          <button
            onClick={() => createTempPlayerAccount(matchIndex, field, value)}
            disabled={creatingPlayer[suggestionKey]}
            className="mt-1 w-full flex items-center justify-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-purple-300 hover:text-white transition-colors disabled:opacity-50"
          >
            {creatingPlayer[suggestionKey] ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <>+ Buat akun temp untuk &quot;{value}&quot;</>
            )}
          </button>
        )}

        {/* Suggestions Dropdown */}
        {hasSuggestions && showSuggestions[suggestionKey] && (
          <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-yellow-400/30 rounded-lg shadow-xl max-h-40 overflow-y-auto">
            <div className="px-3 py-2 text-xs text-yellow-300 font-semibold border-b border-yellow-400/20">
              Saran ({validation.suggestions.length})
            </div>
            {validation.suggestions.map((suggestion: MemberSuggestion, idx: number) => (
              <button
                key={idx}
                onClick={() => applySuggestion(matchIndex, field, suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">{suggestion.name}</span>
                  <span className="text-xs text-green-400">{suggestion.similarity}%</span>
                </div>
                {suggestion.email && (
                  <div className="text-xs text-purple-300">{suggestion.email}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Ekstraksi Gambar Pertandingan
          </h1>
          <p className="text-purple-200">
            Ekstraksi data pertandingan bertenaga AI menggunakan Gemini Vision
          </p>
          
          {/* Format Info */}
          <div className="mt-4 bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
            <h3 className="text-blue-300 font-semibold mb-2">Format Gambar yang Diharapkan (15-20 pertandingan per gambar):</h3>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="bg-blue-500/20 rounded px-3 py-2 text-center">
                <div className="text-blue-200 font-semibold">Kolom 1</div>
                <div className="text-white">Tim 1</div>
                <div className="text-xs text-blue-300">Kevin/Solaso</div>
              </div>
              <div className="bg-red-500/20 rounded px-3 py-2 text-center">
                <div className="text-red-200 font-semibold">Kolom 2</div>
                <div className="text-white">Tim 2</div>
                <div className="text-xs text-red-300">Khai/William</div>
              </div>
              <div className="bg-purple-500/20 rounded px-3 py-2 text-center">
                <div className="text-purple-200 font-semibold">Kolom 3</div>
                <div className="text-white">Lapangan #</div>
                <div className="text-xs text-purple-300">2</div>
              </div>
              <div className="bg-green-500/20 rounded px-3 py-2 text-center">
                <div className="text-green-200 font-semibold">Kolom 4</div>
                <div className="text-white">Kok</div>
                <div className="text-xs text-green-300">4</div>
              </div>
            </div>
            <p className="text-xs text-blue-200 mt-2">
              ℹ️ Setiap baris adalah pertandingan terpisah. Format tim: Pemain1/Pemain2. AI akan mengekstrak SEMUA pertandingan dari gambar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Upload & Preview */}
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Unggah Gambar Pertandingan</h2>
              
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-400 rounded-lg p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-white/5 transition-all"
              >
                {selectedImage ? (
                  <div className="space-y-4">
                    <img
                      src={selectedImage}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-purple-200">Klik untuk mengganti gambar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="mx-auto text-purple-400" size={48} />
                    <div>
                      <p className="text-white font-semibold">
                        Seret gambar ke sini atau klik untuk mengunggah
                      </p>
                      <p className="text-sm text-purple-200">
                        Mendukung: JPG, PNG dengan 4 kolom (Tim 1 | Tim 2 | Lapangan | Kok)
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                onClick={handleProcess}
                disabled={!selectedImage || isProcessing}
                className="w-full mt-4 bg-linear-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Ekstrak Data Pertandingan
                  </>
                )}
              </button>
            </div>

            {isProcessing && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Status Pemrosesan</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin text-purple-400" size={24} />
                    <span className="text-purple-200">{currentStep}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Extracted Data */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="text-red-400 shrink-0" size={24} />
                <div>
                  <h3 className="text-white font-semibold">Kesalahan</h3>
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}

            {extractedData && extractedData.matches.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Pertandingan Terekstrak ({extractedData.total_matches} ditemukan)
                  </h3>
                  {extractedData.confidence > 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-400" size={20} />
                      <span className="text-green-400 font-semibold">
                        {extractedData.confidence}% akurasi
                      </span>
                    </div>
                  )}
                </div>

                {/* Validation Summary */}
                {Object.keys(playerValidation).length > 0 && (() => {
                  const summary = getValidationSummary();
                  return (
                    <div className="bg-slate-800/50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-400" size={16} />
                        <div>
                          <div className="text-xs text-green-300">Cocok</div>
                          <div className="text-white font-semibold">{summary.exactMatches}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="text-yellow-400" size={16} />
                        <div>
                          <div className="text-xs text-yellow-300">Saran</div>
                          <div className="text-white font-semibold">{summary.withSuggestions}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="text-red-400" size={16} />
                        <div>
                          <div className="text-xs text-red-300">Tidak Ada</div>
                          <div className="text-white font-semibold">{summary.noMatches}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Match Date Picker */}
                <div className="bg-blue-500/10 rounded-lg p-4 mb-4 border border-blue-400/30">
                  <label className="block text-sm font-medium text-blue-300 mb-2">
                    Tanggal Pertandingan (Sabtu) *
                  </label>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setMatchDate(e.target.value);
                        return;
                      }
                      setMatchDate(e.target.value);
                    }}
                    min={(() => {
                      const minDate = new Date();
                      minDate.setMonth(minDate.getMonth() - 2);
                      minDate.setDate(1);
                      return minDate.toISOString().split('T')[0];
                    })()}
                    max={(() => {
                      const maxDate = new Date();
                      maxDate.setMonth(maxDate.getMonth() + 2);
                      maxDate.setDate(0); // Last day of next month
                      return maxDate.toISOString().split('T')[0];
                    })()}
                    className="w-full px-4 py-2 bg-white/5 border border-blue-400/30 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  {matchDate && (
                    <p className="text-xs text-green-400 mt-2">
                      {getLocalDateFromString(matchDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>

                {/* Membership Payment Section */}
                {matchDate && (() => {
                  const players = getUniquePlayers();
                  if (players.length === 0) return null;
                  const withoutMembership = players.filter(p => !existingMemberships.has(p));
                  const withMembership = players.filter(p => existingMemberships.has(p));
                  return (
                    <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="text-amber-400 shrink-0" size={18} />
                        <h4 className="text-amber-300 font-semibold text-sm">
                          Pembayaran Membership {new Date(matchDate + 'T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                        </h4>
                        <span className="text-xs text-amber-400/70 ml-auto">
                          {weeksInMonth} Sabtu · Rp {membershipFee.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {loadingMemberships ? (
                        <div className="flex items-center gap-2 text-amber-300/70 text-sm">
                          <Loader2 className="animate-spin" size={14} />
                          Mengecek data membership...
                        </div>
                      ) : (
                        <>
                          {withoutMembership.length > 0 && (
                            <div className="space-y-1.5 mb-3">
                              <p className="text-xs text-amber-300/70 mb-2">Pilih member yang membayar membership hari ini:</p>
                              {withoutMembership.map(name => (
                                <label key={name} className="flex items-center gap-3 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={membershipPayers.has(name)}
                                    onChange={e => {
                                      setMembershipPayers(prev => {
                                        const next = new Set(prev);
                                        e.target.checked ? next.add(name) : next.delete(name);
                                        return next;
                                      });
                                    }}
                                    className="w-4 h-4 rounded accent-amber-400"
                                  />
                                  <span className="text-white text-sm group-hover:text-amber-200 transition-colors">{name}</span>
                                  {membershipPayers.has(name) && (
                                    <span className="text-xs text-amber-400 ml-auto">+ Rp {membershipFee.toLocaleString('id-ID')}</span>
                                  )}
                                </label>
                              ))}
                            </div>
                          )}

                          {withMembership.length > 0 && (
                            <div className="border-t border-amber-400/20 pt-2 mt-2">
                              <p className="text-xs text-green-400/70 mb-1.5">Sudah membership bulan ini:</p>
                              <div className="flex flex-wrap gap-2">
                                {withMembership.map(name => (
                                  <span key={name} className="flex items-center gap-1 text-xs bg-green-500/20 text-green-300 rounded-full px-2.5 py-1">
                                    <CheckCircle size={11} />
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {withoutMembership.length === 0 && (
                            <p className="text-xs text-green-400">✅ Semua pemain sudah membership bulan ini.</p>
                          )}

                          {membershipPayers.size > 0 && (
                            <div className="mt-3 pt-3 border-t border-amber-400/20 flex items-center justify-between">
                              <span className="text-xs text-amber-300">{membershipPayers.size} member akan dibayarkan membership-nya</span>
                              <span className="text-xs font-semibold text-amber-400">
                                Total: Rp {(membershipPayers.size * membershipFee).toLocaleString('id-ID')}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Matches List */}
                <div className="space-y-3 max-h-150 overflow-y-auto pr-2">
                  {extractedData.matches.map((match, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold">Pertandingan #{index + 1}</h4>
                        <button
                          onClick={() => handleDeleteMatch(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Hapus
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {/* Team 1 */}
                        <div className="bg-blue-500/10 rounded p-3 border border-blue-400/20">
                          <div className="text-xs text-blue-300 mb-2 font-semibold">Tim 1</div>
                          {renderPlayerInput(index, 'team1_player1', match.team1_player1, 'Pemain 1')}
                          {renderPlayerInput(index, 'team1_player2', match.team1_player2, 'Pemain 2')}
                        </div>

                        {/* Team 2 */}
                        <div className="bg-red-500/10 rounded p-3 border border-red-400/20">
                          <div className="text-xs text-red-300 mb-2 font-semibold">Tim 2</div>
                          {renderPlayerInput(index, 'team2_player1', match.team2_player1, 'Pemain 1')}
                          {renderPlayerInput(index, 'team2_player2', match.team2_player2, 'Pemain 2')}
                        </div>

                        {/* Court & Shuttlecock */}
                        <div className="col-span-2 grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-purple-200 mb-1">Lapangan #</label>
                            <input
                              type="text"
                              value={match.court_number}
                              onChange={(e) => handleFieldChange(index, 'court_number', e.target.value)}
                              placeholder="Lapangan"
                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white placeholder-purple-300"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-purple-200 mb-1">Jumlah Kok</label>
                            <input
                              type="text"
                              value={match.shuttlecock_amount}
                              onChange={(e) => handleFieldChange(index, 'shuttlecock_amount', e.target.value)}
                              placeholder="Jumlah"
                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white placeholder-purple-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={handleSaveAllMatches}
                    disabled={isSaving || notifStatus === 'sending' || !matchDate}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Simpan Semua {extractedData.total_matches} Pertandingan
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      setExtractedData(null);
                      setMatchDate('');
                      setPlayerValidation({});
                      setNotifStatus('idle');
                      setNotifSummary('');
                      setMembershipPayers(new Set());
                      setExistingMemberships(new Set());
                    }}
                    disabled={isSaving || notifStatus === 'sending'}
                    className="flex-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white py-3 rounded-lg font-semibold border border-white/20 transition-all">
                    Reset
                  </button>
                </div>

                {/* Notification status banner - inside extractedData block removed, shown globally below */}
              </div>
            )}

            {!extractedData && !error && !isProcessing && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
                <Upload className="mx-auto text-purple-400 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Belum Ada Data
                </h3>
                <p className="text-purple-200">
                  Unggah gambar dengan beberapa baris pertandingan (biasanya 15-20 pertandingan) dan klik "Ekstrak Data Pertandingan"
                </p>
              </div>
            )}

            {/* Notification status banner - shown globally, persists after form reset */}
            {notifStatus === 'sending' && (
              <div className="mt-4 flex items-center gap-2 bg-blue-500/20 border border-blue-400/40 rounded-lg px-4 py-3 text-blue-200 text-sm">
                <Loader2 className="animate-spin shrink-0" size={16} />
                <span>Mengirim notifikasi WA &amp; email ke anggota... (jangan tutup halaman)</span>
              </div>
            )}
            {notifStatus === 'done' && notifSummary && (
              <div className="mt-4 flex items-center gap-2 bg-green-500/20 border border-green-400/40 rounded-lg px-4 py-3 text-green-200 text-sm">
                <CheckCircle className="shrink-0" size={16} />
                <span>Notifikasi terkirim · {notifSummary}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
