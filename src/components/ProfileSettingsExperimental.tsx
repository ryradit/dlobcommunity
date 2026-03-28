'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Award, Lock, Eye, EyeOff, LogOut, Shield, Bell, Share2, Globe } from 'lucide-react';
import Image from 'next/image';

interface PerformanceMetric {
  label: string;
  value: number; // percentage 0-100
  metric: string;
}

export default function ProfileSettingsExperimental() {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  // System Access Toggles
  const [publicProfile, setPublicProfile] = useState(true);
  const [biometricAlerts, setBiometricAlerts] = useState(false);
  const [performanceSharing, setPerformanceSharing] = useState(false);

  const memberName = user?.user_metadata?.full_name || 'Member';
  const memberTag = 'ELITE MEMBER'; // Could be dynamic based on tier

  // Sample performance metrics - replace with real data from props
  const performanceMetrics: PerformanceMetric[] = [
    { label: 'Smash Power', value: 78, metric: '(180kg)' },
    { label: 'Improve Reach', value: 42, metric: 'Complete' },
    { label: 'Sprint Explosion', value: 91, metric: 'Complete' },
  ];

  // Sample member stats
  const memberStats = [
    { value: '82%', label: 'Win Rate' },
    { value: '14 Days', label: 'Streak' },
    { value: '42.8K', label: 'Global Rank' },
  ];

  // Sample achievements
  const achievements = [
    { icon: '⭐', label: '3 Times Winner', count: '(3 times)' },
    { icon: '🏆', label: 'Rank Leader', count: '(4 times)' },
    { icon: '🎯', label: 'Title Cup', count: '(5 times)' },
  ];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert('Password tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    // TODO: Implement password change via Auth context
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black opacity-50" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* ELITE MEMBER HEADER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Elite Card */}
          <div className="lg:col-span-1 bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-700 rounded-lg p-6 ">
            <div className="space-y-6">
              {/* Elite Badge */}
              <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full">
                <span className="text-xs font-semibold text-amber-400">⭐ {memberTag}</span>
              </div>

              {/* Member Name */}
              <div>
                <h1 className="text-3xl font-bold mb-1">{memberName}</h1>
                <p className="text-sm text-gray-400">GLOBAL PARK S142 • STRIKE ACCURACY 86.2%</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                {memberStats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-xl font-bold text-amber-400">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Avatar */}
              {user?.user_metadata?.avatar_url && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={memberName}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Performance Radar + Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Performance Radar */}
            <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-700 rounded-lg p-6 h-64 flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-48 h-48">
                  {/* Pentagon shape for radar */}
                  <polygon
                    points="100,20 180,69 147,159 53,159 20,69"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="1"
                  />
                  <polygon
                    points="100,60 147,79 125,130 75,130 53,79"
                    fill="none"
                    stroke="#4B5563"
                    strokeWidth="1"
                  />
                  
                  {/* Performance line - slightly irregular */}
                  <polygon
                    points="100,35 165,75 140,155 60,150 35,80"
                    fill="rgba(251,146,60,0.1)"
                    stroke="#FB923C"
                    strokeWidth="2"
                  />
                  
                  {/* Labels */}
                  <text x="100" y="15" textAnchor="middle" fill="#9CA3AF" fontSize="12">SPEED</text>
                  <text x="175" y="95" textAnchor="start" fill="#9CA3AF" fontSize="12">POWER</text>
                  <text x="155" y="170" textAnchor="middle" fill="#9CA3AF" fontSize="12">AGILITY</text>
                  <text x="45" y="170" textAnchor="middle" fill="#9CA3AF" fontSize="12">ENDURANCE</text>
                  <text x="25" y="95" textAnchor="end" fill="#9CA3AF" fontSize="12">ACCURACY</text>
                </svg>
              </div>
              <div className="absolute top-6 left-6">
                <h3 className="text-sm font-semibold text-gray-300">PERFORMANCE RADAR</h3>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">ELITE TIER</p>
                <p className="text-lg font-bold">ELITE III</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-right">
                <p className="text-xs text-gray-400 mb-2">NEXT TIER</p>
                <p className="text-lg font-bold">50 DAYS</p>
              </div>
            </div>
          </div>
        </div>

        {/* BODY SCAN & PERFORMANCE GOALS */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-700 rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-2">AI BODY SCAN & PERFORMANCE GOALS</h2>
              <p className="text-sm text-gray-400">Biomechanical mapping synchronized with your elite performance objectives.</p>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              {performanceMetrics.map((metric, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{metric.label}</span>
                    <span className="text-xs text-gray-400">{metric.value}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Info Section */}
            <div className="mt-6 p-4 bg-gray-950 border border-gray-700 rounded-lg">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-300 mb-1">MEASUREMENT CALIBRATION</p>
                  <p className="text-xs text-gray-400">Height: Update: +2.2cm. Deviation on Load Item: Right-sided stability deficiency impact to game mechanics.</p>
                </div>
              </div>
            </div>

            {/* GET REAL GOAL Button */}
            <button className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
              <span>GET REAL GOAL</span>
            </button>
          </div>
        </div>

        {/* MEMBER ACHIEVEMENTS */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">MEMBER ACHIEVEMENTS</h2>
            <button className="text-xs font-semibold text-gray-400 hover:text-gray-300">VIEW ALL</button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {achievements.map((achievement, idx) => (
              <div key={idx} className="bg-gray-950 border border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
                <div className="text-4xl mb-3">{achievement.icon}</div>
                <p className="text-sm font-semibold">{achievement.label}</p>
                <p className="text-xs text-gray-400 mt-1">{achievement.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM ACCESS & SECURITY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Account Security */}
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Account Security
            </h2>

            {/* Change Password */}
            <form onSubmit={handlePasswordChange} className="space-y-4 mb-6 pb-6 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300">Ubah Password</h3>
              
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Password Baru</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">Konfirmasi Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi password baru"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPasswordLoading}
                className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 text-black font-semibold rounded-lg transition-colors"
              >
                {isPasswordLoading ? 'Mengubah...' : 'Ubah Password'}
              </button>
            </form>

            {/* Login Methods */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Metode Login</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-black font-bold text-sm">G</div>
                    <div>
                      <p className="text-sm font-medium">Google</p>
                      <p className="text-xs text-gray-500">Connected</p>
                    </div>
                  </div>
                  <button className="text-xs text-gray-400 hover:text-red-400 transition-colors">Disconnect</button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">f</div>
                    <div>
                      <p className="text-sm font-medium">Facebook</p>
                      <p className="text-xs text-gray-500">Not Connected</p>
                    </div>
                  </div>
                  <button className="text-xs text-amber-400 hover:text-amber-300 transition-colors">Connect</button>
                </div>
              </div>
            </div>
          </div>

          {/* System Access Controls */}
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              System Access
            </h2>

            <div className="space-y-4">
              {/* Public Rank Profile */}
              <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Public Rank Profile</p>
                    <p className="text-xs text-gray-500">Others can view your performance</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publicProfile}
                    onChange={(e) => setPublicProfile(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Biometric Alerts */}
              <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Biometric Alerts</p>
                    <p className="text-xs text-gray-500">Receive health notifications</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={biometricAlerts}
                    onChange={(e) => setBiometricAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Performance Sharing */}
              <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Performance Sharing</p>
                    <p className="text-xs text-gray-500">Share data with coaches</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={performanceSharing}
                    onChange={(e) => setPerformanceSharing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Privacy Notice */}
              <p className="text-xs text-gray-500 px-4 pt-2">MANAGE ALEXANDER PRIVACY</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
