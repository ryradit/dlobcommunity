'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PreOrderPage() {
  const [formData, setFormData] = useState({
    nama: '',
    ukuran: '',
    warna: '',
    lengan: 'short', // 'short' or 'long'
    namaPunggung: '',
    tanpaNamaPunggung: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  const ukuranOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  
  // Size guide data
  const sizeGuide = [
    { size: 'XS', tinggi: 65, lebar: 45 },
    { size: 'S', tinggi: 68, lebar: 48 },
    { size: 'M', tinggi: 71, lebar: 51 },
    { size: 'L', tinggi: 74, lebar: 54 },
    { size: 'XL', tinggi: 77, lebar: 57 },
    { size: 'XXL', tinggi: 80, lebar: 62 },
    { size: '3XL', tinggi: 83, lebar: 65 }
  ];
  const warnaOptions = [
    { 
      value: 'blue', 
      label: 'Navy Blue', 
      color: '#0b244c',
      image: '/images/members/model/biru1.jpg'
    },
    { 
      value: 'pink', 
      label: 'Pink', 
      color: '#c8a19c',
      image: '/images/members/model/pink1.jpg'
    },
    { 
      value: 'yellow', 
      label: 'Yellow', 
      color: '#FECB00',
      image: '/images/members/model/kuning1.jpg'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isFormValid = formData.nama && formData.ukuran && formData.warna && 
    (formData.tanpaNamaPunggung || formData.namaPunggung);

  const getSizePrice = (size: string, sleeve: string = 'short') => {
    let basePrice;
    switch (size) {
      case 'XS':
      case 'S':
      case 'M':
      case 'L':
      case 'XL':
        basePrice = 110000;
        break;
      case 'XXL':
        basePrice = 120000;
        break;
      case '3XL':
        basePrice = 130000;
        break;
      default:
        basePrice = 110000; // Default price for XS-XL
    }
    
    // Add long sleeve fee
    const longSleeveFee = sleeve === 'long' ? 10000 : 0;
    return basePrice + longSleeveFee;
  };

  const calculateTotal = () => {
    const baseTotal = getSizePrice(formData.ukuran, formData.lengan);
    
    // No additional cost for name printing - included in base price
    return baseTotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      alert('Harap lengkapi semua field yang wajib diisi');
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      nama: formData.nama,
      ukuran: formData.ukuran,
      warna: formData.warna,
      lengan: formData.lengan,
      namaPunggung: formData.namaPunggung,
      tanpaNamaPunggung: formData.tanpaNamaPunggung
    };

    try {

      const response = await fetch('/api/pre-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save pre-order';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('API Error Details:', errorData);
        } catch (parseError) {
          console.error('Response parsing error:', parseError);
          console.error('Response status:', response.status);
          console.error('Response text:', await response.text());
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setOrderData({
        id: result.data?.id || result.id,
        customer_name: formData.nama,
        jersey_design: warnaOptions.find(w => w.value === formData.warna)?.label || formData.warna,
        size: formData.ukuran,
        sleeve_type: formData.lengan,
        name_on_back: formData.tanpaNamaPunggung ? null : formData.namaPunggung,
        total_amount: calculateTotal()
      });
      setShowPaymentModal(true);
      
    } catch (error) {
      console.error('Error submitting pre-order:', error);
      console.error('Order payload was:', orderPayload);
      
      // Show more detailed error to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Terjadi kesalahan: ${errorMessage}\n\nSilakan coba lagi atau hubungi admin jika masalah berlanjut.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-linear-to-b from-blue-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl shadow-xl p-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Pre-Order Berhasil!</h1>
            <p className="text-lg text-gray-700 mb-6">
              Terima kasih! Pre-order jersey badminton Anda telah berhasil disimpan.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-blue-900 mb-3">Langkah Selanjutnya:</h3>
              <ol className="text-left text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Transfer pembayaran sesuai total yang tertera</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Kirim bukti transfer via WhatsApp</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Jersey akan diproduksi setelah pembayaran dikonfirmasi</span>
                </li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-purple-600 to-sky-600 hover:shadow-lg text-white font-medium py-3 px-8 rounded-xl transition-all duration-300"
            >
              Buat Pre-Order Lain
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Pre-Order Jersey Badminton
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Dapatkan jersey berkualitas premium dengan desain eksklusif untuk komunitas badminton Anda
            </p>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">

                  {/* Left Column - Personal Info */}
                  <div className="xl:col-span-1 space-y-6">
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">1</span>
                        </div>
                        Data Diri
                      </h3>
                      <p className="text-sm text-blue-700">Informasi pribadi Anda</p>
                    </div>
                  
                    {/* Nama */}
                    <div className="group">
                      <label htmlFor="nama" className="flex items-center gap-2 text-sm font-bold text-black mb-3">
                        <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                        </div>
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        id="nama"
                        name="nama"
                        value={formData.nama}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900 font-medium placeholder-gray-400"
                        placeholder="Masukkan nama lengkap Anda"
                        required
                      />
                    </div>

                    {/* Ukuran Jersey */}
                    <div className="group">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-black uppercase tracking-wide">
                          <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                          </div>
                          Pilih Ukuran *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowSizeGuide(true)}
                          className="text-xs text-gray-800 hover:text-black underline font-medium"
                        >
                          Panduan Ukuran
                        </button>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {ukuranOptions.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleSelectChange('ukuran', size)}
                            className={`py-3 text-sm font-bold border-2 transition-all ${
                              formData.ukuran === size
                                ? 'border-black bg-black text-white'
                                : 'border-gray-400 text-black hover:border-black hover:bg-gray-100'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      
                      {/* Price Display */}
                      {!formData.ukuran ? (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Harga berdasarkan ukuran:</p>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>S, M, L, XL:</span>
                              <span className="font-bold">Rp 110.000</span>
                            </div>
                            <div className="flex justify-between">
                              <span>XXL:</span>
                              <span className="font-bold">Rp 120.000</span>
                            </div>
                            <div className="flex justify-between">
                              <span>3XL:</span>
                              <span className="font-bold">Rp 130.000</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-black text-white rounded-lg">
                          <div className="text-sm">
                            <span className="font-medium">Ukuran {formData.ukuran} dipilih</span>
                          </div>
                          <div className="text-lg font-bold">
                            Rp {getSizePrice(formData.ukuran, 'short').toLocaleString('id-ID')}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pilihan Lengan */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-black mb-3 uppercase tracking-wide">
                        <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                        </div>
                        Pilih Lengan *
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleSelectChange('lengan', 'short')}
                          className={`px-4 py-3 text-sm font-bold border-2 transition-all rounded ${
                            formData.lengan === 'short'
                              ? 'border-black bg-black text-white'
                              : 'border-gray-400 text-black hover:border-black hover:bg-gray-100'
                          }`}
                        >
                          Lengan Pendek
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectChange('lengan', 'long')}
                          className={`px-4 py-3 text-sm font-bold border-2 transition-all rounded ${
                            formData.lengan === 'long'
                              ? 'border-black bg-black text-white'
                              : 'border-gray-400 text-black hover:border-black hover:bg-gray-100'
                          }`}
                        >
                          Lengan Panjang <span className="text-xs">(+Rp 10.000)</span>
                        </button>
                      </div>
                      
                      {/* Price Display Based on Size Selection */}
                      {formData.ukuran && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Harga untuk ukuran {formData.ukuran}:</span>
                          </div>
                          <div className="text-lg font-bold text-black">
                            Rp {getSizePrice(formData.ukuran, formData.lengan).toLocaleString('id-ID')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Design & Personalization */}
                  <div className="xl:col-span-1 space-y-6">
                    <div className="mb-6 p-4 bg-green-50 rounded-xl border-l-4 border-green-500 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">2</span>
                        </div>
                        Desain & Personalisasi
                      </h3>
                      <p className="text-sm text-green-700">Pilih warna dan personalisasi jersey</p>
                    </div>

                    {/* Pilih Warna */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-black mb-3 uppercase tracking-wide">
                        <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                        </div>
                        Pilih Warna *
                      </label>
                      <div className="flex gap-3 mb-4">
                        {warnaOptions.map((warna) => (
                          <button
                            key={warna.value}
                            type="button"
                            onClick={() => handleSelectChange('warna', warna.value)}
                            className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                              formData.warna === warna.value ? 'border-black scale-110' : 'border-gray-400 hover:border-gray-600'
                            }`}
                          >
                            <div 
                              className="w-full h-full rounded-full"
                              style={{ backgroundColor: warna.color }}
                            ></div>
                            {formData.warna === warna.value && (
                              <div className="absolute inset-0 rounded-full border-2 border-white"></div>
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-gray-800 mb-4 font-medium">
                        Warna terpilih: {formData.warna ? warnaOptions.find(w => w.value === formData.warna)?.label : 'Belum dipilih'}
                      </p>
                      
                      {/* Color Preview Cards */}
                      <div className="grid grid-cols-3 gap-3">
                        {warnaOptions.map((warna) => (
                          <div
                            key={warna.value}
                            className={`relative aspect-3/4 overflow-hidden bg-gray-100 border-2 transition-all rounded-lg cursor-pointer ${
                              formData.warna === warna.value ? 'border-black' : 'border-transparent hover:border-gray-300'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectChange('warna', warna.value)}
                              className="w-full h-full absolute inset-0"
                            >
                              <img
                                src={warna.image}
                                alt={`Jersey ${warna.label}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center font-medium">
                                {warna.label}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageUrl(warna.image);
                                setShowImageDialog(true);
                              }}
                              className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-white text-black p-1 rounded text-xs font-medium transition-colors z-10"
                            >
                              👁️
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nama di Punggung */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-black mb-3">
                        <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                        </div>
                        Nama di Punggung Jersey
                      </label>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="tanpaNamaPunggung"
                            name="tanpaNamaPunggung"
                            checked={formData.tanpaNamaPunggung}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <label htmlFor="tanpaNamaPunggung" className="text-gray-700 font-medium">
                            Tanpa nama di punggung (harga sama)
                          </label>
                        </div>
                        
                        {!formData.tanpaNamaPunggung && (
                          <input
                            type="text"
                            id="namaPunggung"
                            name="namaPunggung"
                            value={formData.namaPunggung}
                            onChange={handleInputChange}
                            className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900 font-medium placeholder-gray-400"
                            placeholder="Masukkan nama untuk punggung jersey (maks 12 karakter)"
                            maxLength={12}
                            required={!formData.tanpaNamaPunggung}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary & Submit */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      Ringkasan Pesanan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nama:</span>
                          <span className="font-medium text-gray-900">{formData.nama || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ukuran:</span>
                          <span className="font-medium text-gray-900">{formData.ukuran || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Warna:</span>
                          <span className="font-medium text-gray-900">
                            {formData.warna ? warnaOptions.find(w => w.value === formData.warna)?.label : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lengan:</span>
                          <span className="font-medium text-gray-900">
                            {formData.lengan === 'long' ? 'Panjang (+Rp 10.000)' : 'Pendek'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nama Punggung:</span>
                          <span className="font-medium text-gray-900">
                            {formData.tanpaNamaPunggung ? 'Tanpa nama' : (formData.namaPunggung || '-')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Price Breakdown */}
                    {formData.ukuran && (
                      <div className="mt-6 pt-4 border-t border-gray-300">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Jersey ({formData.ukuran}, {formData.lengan === 'long' ? 'Lengan Panjang' : 'Lengan Pendek'}):</span>
                            <span className="font-bold text-gray-900">Rp {getSizePrice(formData.ukuran, formData.lengan).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Cetak Nama Punggung:</span>
                            <span className="font-bold text-green-600">Gratis (Sudah Termasuk)</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                            <span className="text-gray-900">Total Pembayaran:</span>
                            <span className="text-green-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      disabled={!isFormValid || isSubmitting}
                      className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                        isFormValid && !isSubmitting
                          ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 shadow-lg'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Menyimpan...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>SUBMIT PRE-ORDER</span>
                          <div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>

                  {!isFormValid && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 inline-block">
                        Harap lengkapi semua field yang wajib diisi (*)
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 bg-white border-2 border-gray-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
              <h3 className="font-bold text-black text-lg flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                Informasi Penting
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                    <div>
                      <p className="font-medium text-black">Batas Pre-Order</p>
                      <p className="text-sm text-gray-600">15 Desember 2025</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                    <div>
                      <p className="font-medium text-black">Estimasi Pengiriman</p>
                      <p className="text-sm text-gray-600">Januari 2026</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                    <div>
                      <p className="font-medium text-black">Pembayaran</p>
                      <p className="text-sm text-gray-600">Transfer Bank & E-Wallet</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                    <div>
                      <p className="font-medium text-black">Material</p>
                      <p className="text-sm text-gray-600">Dri-FIT Premium Quality</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">📏</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Panduan Ukuran Jersey</h3>
                    <p className="text-sm text-gray-600">Temukan ukuran yang pas untuk Anda</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              {/* Size Chart Table */}
              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <div className="bg-linear-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="font-bold text-gray-900 text-sm uppercase tracking-wide">Ukuran</div>
                    <div className="font-bold text-gray-900 text-sm text-center uppercase tracking-wide">Tinggi (cm)</div>
                    <div className="font-bold text-gray-900 text-sm text-center uppercase tracking-wide">Lebar (cm)</div>
                    <div className="font-bold text-gray-900 text-sm text-center uppercase tracking-wide">Harga</div>
                  </div>
                </div>
                <div className="bg-white">
                  {sizeGuide.map((item, index) => (
                    <div 
                      key={item.size} 
                      className={`px-6 py-4 border-b border-gray-100 last:border-b-0 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      } hover:bg-blue-50 transition-colors cursor-pointer ${
                        formData.ukuran === item.size ? 'bg-blue-100 border-blue-200' : ''
                      }`}
                      onClick={() => handleSelectChange('ukuran', item.size)}
                    >
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            formData.ukuran === item.size 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-800 text-white'
                          }`}>
                            {item.size}
                          </div>
                          {formData.ukuran === item.size && (
                            <span className="text-blue-600 text-sm font-medium">✓ Dipilih</span>
                          )}
                        </div>
                        <div className="font-semibold text-gray-800 text-center">
                          {item.tinggi}
                        </div>
                        <div className="font-semibold text-gray-800 text-center">
                          {item.lebar}
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-gray-900">
                            Rp {getSizePrice(item.size, 'short').toLocaleString('id-ID')}
                          </div>
                          <div className="text-xs text-gray-600">
                            Lengan pendek
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Tips and Information */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 text-lg">💡</span>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-2">Tips Memilih Ukuran</h4>
                      <ul className="space-y-1 text-sm text-blue-800">
                        <li>• Ukur jersey favorit Anda sebagai referensi</li>
                        <li>• Untuk fit yang lebih longgar, pilih 1 size lebih besar</li>
                        <li>• Jika ragu antara 2 ukuran, pilih yang lebih besar</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-green-600 text-lg">📐</span>
                    <div>
                      <h4 className="font-bold text-green-900 mb-2">Informasi Ukuran</h4>
                      <ul className="space-y-1 text-sm text-green-800">
                        <li>• Ukuran dalam centimeter (cm)</li>
                        <li>• Toleransi pengukuran ±2cm</li>
                        <li>• Diukur dalam keadaan jersey rata/flat</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Information */}
              <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 text-lg">💰</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-yellow-900 mb-3">Informasi Harga</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-yellow-900 mb-2">Lengan Pendek:</p>
                        <div className="space-y-1 text-yellow-800">
                          <div className="flex justify-between">
                            <span>S, M, L, XL:</span>
                            <span className="font-bold">Rp 110.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>XXL:</span>
                            <span className="font-bold">Rp 120.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>3XL:</span>
                            <span className="font-bold">Rp 130.000</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-yellow-900 mb-2">Lengan Panjang (+Rp 10.000):</p>
                        <div className="space-y-1 text-yellow-800">
                          <div className="flex justify-between">
                            <span>S, M, L, XL:</span>
                            <span className="font-bold">Rp 120.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>XXL:</span>
                            <span className="font-bold">Rp 130.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>3XL:</span>
                            <span className="font-bold">Rp 140.000</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <span className="text-green-600">✓</span>
                        <span className="font-medium text-sm">Cetak nama di punggung sudah termasuk dalam harga</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                >
                  Tutup Panduan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImageDialog(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <img
              src={selectedImageUrl}
              alt="Jersey Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && orderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pre-Order Berhasil!</h2>
                <p className="text-gray-600">Silakan lakukan pembayaran untuk mengkonfirmasi pesanan</p>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Detail Pesanan</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama:</span>
                    <span className="font-medium text-gray-900">{orderData.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jersey:</span>
                    <span className="font-medium text-gray-900">{orderData.jersey_design}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ukuran:</span>
                    <span className="font-medium text-gray-900">{orderData.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lengan:</span>
                    <span className="font-medium text-gray-900">{orderData.sleeve_type === 'long' ? 'Panjang' : 'Pendek'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama Punggung:</span>
                    <span className="font-medium text-gray-900">{orderData.name_on_back || 'Tanpa nama'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">Rp {orderData.total_amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Informasi Pembayaran</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-lg">🏦</span>
                      </div>
                      <p className="font-bold text-blue-900 text-lg mb-2">Bank BCA</p>
                      <p className="text-blue-800 font-mono text-2xl font-bold mb-1">1082386054</p>
                      <p className="text-blue-700 font-medium">a.n. Ryan Radityatama</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm font-medium">
                        💡 Transfer sesuai dengan total pembayaran yang tertera
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Proof */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Kirim Bukti Pembayaran</h3>
                <p className="text-base text-gray-700 font-medium mb-4 bg-gray-100 p-3 rounded-lg border border-gray-200">
                  Setelah transfer, kirim bukti pembayaran via WhatsApp:
                </p>
                <a
                  href={`https://wa.me/6281387643604?text=Halo,%20saya%20sudah%20melakukan%20pembayaran%20pre-order%20jersey%20badminton:%0A%0ANama:%20${orderData.customer_name}%0AJersey:%20${orderData.jersey_design}%0AUkuran:%20${orderData.size}%0ATotal:%20Rp%20${orderData.total_amount.toLocaleString('id-ID')}%0A%0ABerikut%20bukti%20pembayarannya:`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-pink-600 to-yellow-500 hover:shadow-lg text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                  </svg>
                  <span>Kirim via WhatsApp</span>
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setOrderData(null);
                    setSubmitted(true);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors"
                >
                  Nanti Saja
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setOrderData(null);
                    setSubmitted(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-sky-600 hover:shadow-lg text-white font-medium py-3 px-4 rounded-xl transition-all duration-300"
                >
                  Sudah Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}