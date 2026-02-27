'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Loader2, CheckCircle, XCircle, AlertCircle, ChevronDown, Save } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to parse date string as local date (not UTC)
  const getLocalDateFromString = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

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
    if (selectedDate.getDay() !== 6) {
      alert('Tanggal harus hari Sabtu!');
      return;
    }

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
        
        // Reset form
        setExtractedData(null);
        setSelectedImage(null);
        setMatchDate('');
        setPlayerValidation({});
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
            value={value}
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
                      const selectedDate = getLocalDateFromString(e.target.value);
                      if (selectedDate.getDay() === 6) {
                        setMatchDate(e.target.value);
                      } else {
                        alert('Harap pilih hari Sabtu!');
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
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
                    disabled={isSaving || !matchDate}
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
                    }}
                    disabled={isSaving}
                    className="flex-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white py-3 rounded-lg font-semibold border border-white/20 transition-all">
                    Reset
                  </button>
                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
