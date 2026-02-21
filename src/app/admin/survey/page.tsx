'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Calendar, Users, TrendingUp, 
  Eye, BarChart3, Clock, CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SurveyAdminDashboard from '@/components/SurveyAdminDashboard';

interface SurveyInstance {
  id: string;
  title: string;
  description: string;
  status: string;
  trigger_type: string;
  triggered_at: string;
  expires_at: string | null;
  template_id: string;
  survey_templates: {
    title: string;
    type: string;
  };
}

interface SurveyResponse {
  id: string;
  instance_id: string;
  completion_status: string;
  sentiment_label: string | null;
  started_at: string;
  completed_at: string | null;
  is_anonymous: boolean;
}

type TabType = 'surveys' | 'responses' | 'analytics';

export default function AdminSurveyPage() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [surveys, setSurveys] = useState<SurveyInstance[]>([]);
  const [responses, setResponses] = useState<Record<string, SurveyResponse[]>>({});
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all survey instances
      const { data: instancesData, error: instancesError } = await supabase
        .from('survey_instances')
        .select(`
          *,
          survey_templates (
            title,
            type
          )
        `)
        .order('triggered_at', { ascending: false });

      if (instancesError) throw instancesError;

      // Fetch responses for each instance
      const { data: responsesData, error: responsesError } = await supabase
        .from('survey_responses')
        .select('*');

      if (responsesError) throw responsesError;

      // Group responses by instance_id
      const groupedResponses: Record<string, SurveyResponse[]> = {};
      responsesData?.forEach((response: SurveyResponse) => {
        if (!groupedResponses[response.instance_id]) {
          groupedResponses[response.instance_id] = [];
        }
        groupedResponses[response.instance_id].push(response);
      });

      setSurveys(instancesData || []);
      setResponses(groupedResponses);
      
      // Auto-select first survey if none selected
      if (!selectedSurvey && instancesData && instancesData.length > 0) {
        setSelectedSurvey(instancesData[0]);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Aktif', icon: CheckCircle },
      closed: { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', label: 'Ditutup', icon: XCircle },
      archived: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Arsip', icon: AlertCircle },
    };
    
    const badge = badges[status as keyof typeof badges] || badges.active;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  const getSurveyStats = (instanceId: string) => {
    const instanceResponses = responses[instanceId] || [];
    const total = instanceResponses.length;
    const completed = instanceResponses.filter(r => r.completion_status === 'completed').length;
    const positive = instanceResponses.filter(r => r.sentiment_label === 'positive').length;
    const negative = instanceResponses.filter(r => r.sentiment_label === 'negative').length;
    
    return { total, completed, positive, negative };
  };

  const tabs = [
    { id: 'analytics' as TabType, label: 'AI Insights', icon: BarChart3 },
    { id: 'responses' as TabType, label: 'Responses', icon: Users },
    { id: 'surveys' as TabType, label: 'Survey History', icon: MessageSquare },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Survey Analytics
          </h1>
          <p className="text-zinc-400">Survey otomatis berjalan setelah event - Lihat hasil dan insight AI</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'surveys' && (
            <motion.div
              key="surveys"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {surveys.length === 0 ? (
                <div className="bg-zinc-900 rounded-2xl p-12 text-center border border-white/10">
                  <MessageSquare className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Survey</h3>
                  <p className="text-zinc-400">Survey akan otomatis muncul setelah event latihan atau pertandingan</p>
                  <p className="text-zinc-500 text-sm mt-2">Sistem AI akan memproses feedback member secara otomatis</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {surveys.map((survey) => {
                    const stats = getSurveyStats(survey.id);
                    
                    return (
                      <div
                        key={survey.id}
                        className="bg-zinc-900 rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedSurvey(survey);
                          setActiveTab('analytics');
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-white">{survey.title}</h3>
                              {getStatusBadge(survey.status)}
                            </div>
                            <p className="text-zinc-400 text-sm mb-3">{survey.description}</p>
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(survey.triggered_at).toLocaleDateString('id-ID')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span className="capitalize">{survey.trigger_type.replace('_', ' ')}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSurvey(survey);
                              setActiveTab('analytics');
                            }}
                            className="bg-blue-600/20 text-blue-400 p-2 rounded-lg hover:bg-blue-600/30 transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/10">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
                            <p className="text-xs text-zinc-500">Total Responses</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
                            <p className="text-xs text-zinc-500">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-400">{stats.positive}</p>
                            <p className="text-xs text-zinc-500">Positive</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-400">{stats.negative}</p>
                            <p className="text-xs text-zinc-500">Negative</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'responses' && (
            <motion.div
              key="responses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {surveys.length === 0 ? (
                <div className="bg-zinc-900 rounded-2xl p-12 text-center border border-white/10">
                  <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Responses</h3>
                  <p className="text-zinc-400">Responses akan muncul setelah member mengisi survey</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {surveys.map((survey) => {
                    const surveyResponses = responses[survey.id] || [];
                    
                    if (surveyResponses.length === 0) return null;
                    
                    return (
                      <div key={survey.id} className="bg-zinc-900 rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">{survey.title}</h3>
                        <div className="space-y-2">
                          {surveyResponses.map((response) => (
                            <div
                              key={response.id}
                              className="bg-zinc-800 rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`w-2 h-2 rounded-full ${
                                    response.completion_status === 'completed' ? 'bg-green-500' :
                                    response.completion_status === 'in_progress' ? 'bg-yellow-500' :
                                    'bg-gray-500'
                                  }`} />
                                  <div>
                                    <p className="text-sm font-medium text-white flex items-center gap-2">
                                      Response #{response.id.slice(0, 8)}
                                      {response.is_anonymous && (
                                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                                          Anonymous
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                      {response.completed_at 
                                        ? `Completed: ${new Date(response.completed_at).toLocaleString('id-ID')}`
                                        : `Started: ${new Date(response.started_at).toLocaleString('id-ID')}`
                                      }
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {response.sentiment_label && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      response.sentiment_label === 'positive' ? 'bg-green-500/20 text-green-300' :
                                      response.sentiment_label === 'negative' ? 'bg-red-500/20 text-red-300' :
                                      'bg-yellow-500/20 text-yellow-300'
                                    }`}>
                                      {response.sentiment_label}
                                    </span>
                                  )}
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    response.completion_status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                    response.completion_status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                                    'bg-gray-500/20 text-gray-300'
                                  }`}>
                                    {response.completion_status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {selectedSurvey ? (
                <div>
                  {/* Survey Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Pilih Survey untuk Analisis
                    </label>
                    <select
                      value={selectedSurvey.id}
                      onChange={(e) => {
                        const survey = surveys.find(s => s.id === e.target.value);
                        if (survey) setSelectedSurvey(survey);
                      }}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {surveys.map((survey) => (
                        <option key={survey.id} value={survey.id}>
                          {survey.title} - {new Date(survey.triggered_at).toLocaleDateString('id-ID')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Analytics Dashboard Component */}
                  <SurveyAdminDashboard
                    instanceId={selectedSurvey.id}
                    surveyTitle={selectedSurvey.title}
                  />
                </div>
              ) : (
                <div className="bg-zinc-900 rounded-2xl p-12 text-center border border-white/10">
                  <BarChart3 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Data Survey</h3>
                  <p className="text-zinc-400">Survey akan otomatis ter-trigger setelah event latihan</p>
                  <p className="text-zinc-500 text-sm mt-2">AI akan menganalisis feedback member dan menampilkan insight di sini</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
