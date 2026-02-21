'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';
import SurveyAgent from '@/components/SurveyAgent';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SurveyInstance {
  id: string;
  title: string;
  description: string;
  trigger_type: string;
  triggered_at: string;
  expires_at: string | null;
  status: string;
}

interface SurveyResponse {
  id: string;
  instance_id: string;
  completion_status: string;
  started_at: string;
  completed_at: string | null;
}

export default function SurveyPage() {
  const { user } = useAuth();
  
  const [availableSurveys, setAvailableSurveys] = useState<SurveyInstance[]>([]);
  const [completedSurveys, setCompletedSurveys] = useState<SurveyResponse[]>([]);
  const [activeSurvey, setActiveSurvey] = useState<SurveyInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSurveys();
  }, [user]);

  const loadSurveys = async () => {
    try {
      setError(null);
      
      // Get all active survey instances (no auth required)
      const { data: instances, error: instancesError } = await supabase
        .from('survey_instances')
        .select('*')
        .eq('status', 'active')
        .order('triggered_at', { ascending: false });

      if (instancesError) {
        console.error('Survey instances error:', instancesError);
        throw new Error(`Failed to load surveys: ${instancesError.message || 'Unknown error'}`);
      }

      // Get user's responses only if logged in
      let completedInstanceIds: string[] = [];
      if (user) {
        const { data: responses, error: responsesError } = await supabase
          .from('survey_responses')
          .select('*')
          .eq('member_id', user.id);

        if (responsesError) {
          console.error('Survey responses error:', responsesError);
          // Continue even if responses fail - just don't filter
        } else {
          completedInstanceIds = responses
            ?.filter((r: SurveyResponse) => r.completion_status === 'completed')
            .map((r: SurveyResponse) => r.instance_id) || [];
          
          setCompletedSurveys(responses || []);
        }
      }

      const available = instances?.filter(
        (i: SurveyInstance) => !completedInstanceIds.includes(i.id)
      ) || [];

      setAvailableSurveys(available);
    } catch (error) {
      console.error('Error loading surveys:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat survey';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSurvey = (survey: SurveyInstance) => {
    setActiveSurvey(survey);
  };

  const handleSurveyComplete = () => {
    setActiveSurvey(null);
    loadSurveys();
  };

  // Show survey chat interface
  if (activeSurvey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setActiveSurvey(null)}
            className="mb-4 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            ← Kembali ke daftar survey
          </button>
          <div className="h-[calc(100vh-120px)]">
            <SurveyAgent
              instanceId={activeSurvey.id}
              memberId={user?.id}
              surveyTitle={activeSurvey.title}
              onComplete={handleSurveyComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3e6461] to-[#1e4843] text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-3">Feedback & Saran DLOB</h1>
            <p className="text-white/80 text-lg">
              Sampaikan pendapat Anda tentang apapun - manajemen, harga, pertandingan, atau yang lainnya
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Survey Tersedia</p>
                <p className="text-3xl font-bold text-[#3e6461]">{availableSurveys.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Sudah Diselesaikan</p>
                <p className="text-3xl font-bold text-green-600">{completedSurveys.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Kontribusi Anda</p>
                <p className="text-3xl font-bold text-purple-600">
                  {completedSurveys.length > 0 ? 'Aktif' : 'Mulai'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Available Surveys */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e6461]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Gagal Memuat Survey</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={loadSurveys}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              Coba Lagi
            </button>
            <p className="text-sm text-red-600 mt-4">
              Jika masalah berlanjut, hubungi administrator untuk setup database survey.
            </p>
          </div>
        ) : (
          <>
            {availableSurveys.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Survey Aktif</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {availableSurveys.map((survey, index) => (
                    <motion.div
                      key={survey.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow group"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#3e6461] to-[#1e4843] rounded-xl flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800 mb-1">{survey.title}</h3>
                          <p className="text-sm text-slate-600">{survey.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>~3 menit</span>
                        </div>
                <span>•</span>
                        <span className="capitalize">{survey.trigger_type.replace('_', ' ')}</span>
                      </div>

                      <button
                        onClick={() => handleStartSurvey(survey)}
                        className="w-full bg-gradient-to-r from-[#3e6461] to-[#1e4843] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:gap-3"
                      >
                        Mulai Survey
                        <ArrowRight className="w-5 h-5 transition-all" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {availableSurveys.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Tidak Ada Survey Aktif</h3>
                <p className="text-slate-600">
                  {completedSurveys.length > 0 
                    ? 'Anda sudah menyelesaikan semua survey yang tersedia. Terima kasih! 🎉'
                    : 'Belum ada survey yang tersedia saat ini.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
