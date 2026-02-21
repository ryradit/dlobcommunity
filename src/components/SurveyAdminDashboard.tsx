'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, Users, MessageSquare, 
  CheckCircle, BarChart3, Sparkles, Download, RefreshCw 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SurveyInsights {
  id: string;
  instance_id: string;
  total_responses: number;
  completion_rate: number;
  avg_sentiment_score: number;
  summary: string;
  key_findings: string[];
  top_positive_points: string[];
  top_improvement_areas: string[];
  feature_requests: string[];
  actionable_recommendations: string[];
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topic_frequency: Record<string, number>;
  generated_at: string;
}

interface SurveyAdminDashboardProps {
  instanceId: string;
  surveyTitle: string;
}

export default function SurveyAdminDashboard({ instanceId, surveyTitle }: SurveyAdminDashboardProps) {
  const [insights, setInsights] = useState<SurveyInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [instanceId]);

  const loadInsights = async () => {
    try {
      const response = await fetch(`/api/survey/insights?instanceId=${instanceId}`);
      const data = await response.json();
      
      if (data.insights) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/survey/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId }),
      });

      const data = await response.json();
      if (data.insights) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSentimentIcon = (score: number) => {
    if (score >= 0.3) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (score <= -0.3) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-yellow-600" />;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.3) return 'text-green-600';
    if (score <= -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 0.3) return 'Positif';
    if (score <= -0.3) return 'Negatif';
    return 'Netral';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-12 text-center shadow-lg border border-white/10">
        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10 text-zinc-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Belum Ada Insights</h3>
        <p className="text-zinc-400 mb-6">
          Generate AI insights dari survey responses yang sudah masuk
        </p>
        <button
          onClick={generateInsights}
          disabled={isGenerating}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate AI Insights
            </>
          )}
        </button>
      </div>
    );
  }

  const { sentiment_distribution } = insights;
  const totalSentiment = sentiment_distribution.positive + sentiment_distribution.neutral + sentiment_distribution.negative;

  return (
    <div className="space-y-6">
      {/* Header with Regenerate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{surveyTitle}</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Dianalisis {new Date(insights.generated_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <button
          onClick={generateInsights}
          disabled={isGenerating}
          className="bg-zinc-900 border border-white/10 text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-800 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-2xl p-6 shadow-lg border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="text-xs text-zinc-500 font-medium">Responses</span>
          </div>
          <p className="text-3xl font-bold text-white">{insights.total_responses}</p>
          <p className="text-xs text-zinc-400 mt-1">{insights.completion_rate.toFixed(0)}% completion</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 rounded-2xl p-6 shadow-lg border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            {getSentimentIcon(insights.avg_sentiment_score)}
            <span className="text-xs text-zinc-500 font-medium">Sentiment</span>
          </div>
          <p className={`text-3xl font-bold ${getSentimentColor(insights.avg_sentiment_score)}`}>
            {getSentimentLabel(insights.avg_sentiment_score)}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Score: {insights.avg_sentiment_score.toFixed(2)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900 rounded-2xl p-6 shadow-lg border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-xs text-zinc-500 font-medium">Positive</span>
          </div>
          <p className="text-3xl font-bold text-green-500">{sentiment_distribution.positive}</p>
          <p className="text-xs text-zinc-400 mt-1">
            {((sentiment_distribution.positive / totalSentiment) * 100).toFixed(0)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900 rounded-2xl p-6 shadow-lg border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 text-purple-500" />
            <span className="text-xs text-zinc-500 font-medium">Topics</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {Object.keys(insights.topic_frequency).length}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Key themes</p>
        </motion.div>
      </div>

      {/* AI Summary */}
      <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-2xl p-6 border border-blue-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white">AI Summary</h3>
        </div>
        <p className="text-zinc-300 leading-relaxed">{insights.summary}</p>
      </div>

      {/* Main Insights Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Key Findings */}
        <div className="bg-zinc-900 rounded-2xl p-6 shadow-lg border border-white/10">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Key Findings
          </h3>
          <ul className="space-y-3">
            {insights.key_findings.map((finding, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 text-sm text-zinc-300"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span>{finding}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Top Positive Points */}
        <div className="bg-zinc-900 rounded-2xl p-6 shadow-lg border border-white/10">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            What Members Loved
          </h3>
          <ul className="space-y-3">
            {insights.top_positive_points.map((point, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 text-sm text-zinc-300"
              >
                <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                <span>{point}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Improvement Areas */}
        <div className="bg-zinc-900 rounded-2xl p-6 shadow-lg border border-white/10">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Improvement Areas
          </h3>
          <ul className="space-y-3">
            {insights.top_improvement_areas.map((area, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 text-sm text-zinc-300"
              >
                <span className="text-orange-500 flex-shrink-0 mt-0.5">→</span>
                <span>{area}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Feature Requests */}
        <div className="bg-zinc-900 rounded-2xl p-6 shadow-lg border border-white/10">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Feature Requests
          </h3>
          <ul className="space-y-3">
            {insights.feature_requests.map((request, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 text-sm text-zinc-300"
              >
                <span className="text-purple-500 flex-shrink-0 mt-0.5">💡</span>
                <span>{request}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
          <Sparkles className="w-6 h-6" />
          AI Recommendations for Admin
        </h3>
        <ul className="space-y-3">
          {insights.actionable_recommendations.map((rec, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3"
            >
              <span className="flex-shrink-0 w-6 h-6 bg-white/20 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              <span className="text-white/95">{rec}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
