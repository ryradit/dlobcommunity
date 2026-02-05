'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Bell, Download, CheckCircle } from 'lucide-react';

export default function PembayaranPage() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Mock data
  const walletData = {
    balance: 450000,
    credits: 450000,
  };

  const subscription = {
    plan: 'Gold Member',
    status: 'active',
    expiresAt: 'March 15, 2026',
    price: 99000,
    nextBilling: 'February 15, 2026',
    benefits: ['Unlimited court bookings', 'Priority tournament entry', 'Free coaching session/month'],
  };

  const transactions = [
    {
      id: 1,
      type: 'court_booking',
      description: 'Booking Court A - Sabtu 12:00-14:00',
      amount: -75000,
      date: '2025-01-29',
      status: 'completed',
    },
    {
      id: 2,
      type: 'tournament',
      description: 'Turnamen DLOB Open 2026',
      amount: -150000,
      date: '2025-01-27',
      status: 'completed',
    },
    {
      id: 3,
      type: 'subscription',
      description: 'Subscription Gold Member',
      amount: -99000,
      date: '2025-01-20',
      status: 'completed',
    },
    {
      id: 4,
      type: 'topup',
      description: 'Top-up via Transfer Bank',
      amount: 500000,
      date: '2025-01-15',
      status: 'completed',
    },
  ];

  const savedCards = [
    {
      id: 1,
      type: 'credit_card',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/26',
      isDefault: true,
    },
    {
      id: 2,
      type: 'credit_card',
      last4: '5555',
      brand: 'Mastercard',
      expiry: '08/27',
      isDefault: false,
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-white mb-2">💳 Pembayaran</h1>
        <p className="text-zinc-400 mb-8">Kelola metode pembayaran, saldo, dan riwayat transaksi Anda</p>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <p className="text-blue-200 mb-2">Saldo DLOB Credits</p>
          <h2 className="text-4xl font-bold mb-6">{formatCurrency(walletData.balance)}</h2>
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
              Top Up
            </button>
            <button className="px-6 py-2 bg-white/20 border border-white/30 font-semibold rounded-lg hover:bg-white/30 transition-colors">
              Tarik Dana
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Metode Pembayaran Tersedia</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🏦', label: 'Transfer Bank', available: true },
              { icon: '💳', label: 'Kartu Kredit', available: true },
              { icon: '📱', label: 'E-Wallet', available: true },
            ].map((method, index) => (
              <div
                key={index}
                className={`border rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  method.available
                    ? 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                    : 'border-white/10 bg-white/5 opacity-50'
                }`}
              >
                <p className="text-4xl mb-3">{method.icon}</p>
                <p className="text-white font-semibold text-lg">{method.label}</p>
                {!method.available && <p className="text-xs text-zinc-500 mt-2">Segera hadir</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Saved Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Kartu Tersimpan</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors">
              <Plus className="w-5 h-5" />
              Tambah Kartu
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedCards.map((card) => (
              <div
                key={card.id}
                className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 text-white relative group"
              >
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <p className="text-sm opacity-80">Kartu Kredit</p>
                    <p className="text-xl font-bold">{card.brand}</p>
                  </div>
                  {card.isDefault && (
                    <div className="px-3 py-1 bg-white/20 rounded-full">
                      <p className="text-xs font-semibold">Default</p>
                    </div>
                  )}
                </div>
                <p className="text-3xl font-bold tracking-wider mb-8">•••• {card.last4}</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-80">Berlaku Hingga</p>
                    <p className="text-sm font-semibold">{card.expiry}</p>
                  </div>
                  <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Subscription */}
        <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Langganan Aktif</h2>
              <p className="text-zinc-400">Paket {subscription.plan}</p>
            </div>
            <div className="px-4 py-2 bg-green-500/20 rounded-full">
              <p className="text-green-400 font-semibold text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Aktif
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-4">Keuntungan Paket</h3>
              <ul className="space-y-3">
                {subscription.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm text-zinc-400 mb-1">Harga Paket</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(subscription.price)}</p>
                <p className="text-xs text-zinc-500 mt-1">per bulan</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm text-zinc-400 mb-1">Berakhir Pada</p>
                <p className="text-lg font-bold text-white">{subscription.expiresAt}</p>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="flex gap-2">
                  <Bell className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-300">Pengingat Pembaruan</p>
                    <p className="text-xs text-blue-400">Pembayaran berikutnya: {subscription.nextBilling}</p>
                  </div>
                </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">
                Kelola Langganan
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Riwayat Transaksi</h2>
            <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              <Download className="w-4 h-4" />
              Unduh
            </button>
          </div>

          {transactions.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">Belum ada transaksi</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-lg text-xl">
                        {transaction.type === 'court_booking' && '🏸'}
                        {transaction.type === 'tournament' && '🏆'}
                        {transaction.type === 'subscription' && '💳'}
                        {transaction.type === 'topup' && '➕'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{transaction.description}</p>
                        <p className="text-sm text-zinc-400">
                          {new Date(transaction.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${transaction.amount > 0 ? 'text-green-400' : 'text-white'}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-green-400 font-medium">Selesai</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="w-full mt-6 py-3 text-blue-400 font-semibold border-2 border-blue-400/20 rounded-xl hover:border-blue-400/50 hover:bg-blue-400/10 transition-colors">
            Lihat Semua Transaksi
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Pembayaran Baru</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Tipe Pembayaran</label>
                <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40">
                  <option>Biaya Keanggotaan</option>
                  <option>Biaya Pertandingan</option>
                  <option>Biaya Turnamen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Jumlah</label>
                <input
                  type="number"
                  placeholder="Rp 0"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Metode Pembayaran</label>
                <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40">
                  <option>Transfer Bank</option>
                  <option>Kartu Kredit</option>
                  <option>E-Wallet</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 bg-white text-zinc-950 font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
