'use client';

import React from 'react';
import SmartCropImage from '@/components/SmartCropImage';

interface Member {
  id: number;
  name: string;
  photo: string | null;
}

interface HallOfFameSectionProps {
  showAll?: boolean;
  className?: string;
}

// DLOB Hall of Fame Members
const hallOfFameMembers: Member[] = [
  { id: 1, name: 'Wahyu', photo: '/images/members/wahyu.jpg' },
  { id: 2, name: 'Tian', photo: '/images/members/tian2.jpg' },
  { id: 3, name: 'Danif', photo: '/images/members/danif.jpg' },
  { id: 4, name: 'Wiwin', photo: '/images/members/wiwin.jpg' },
  { id: 5, name: 'Adit', photo: '/images/members/adit.jpg' },
  { id: 6, name: 'Kiki', photo: '/images/members/kiki.jpg' },
  { id: 7, name: 'Zaka', photo: '/images/members/zaka.jpg' },
  { id: 8, name: 'Dimas', photo: '/images/members/dimas.jpg' },
  { id: 9, name: 'Eka', photo: '/images/members/eka.jpg' },
  { id: 10, name: 'Herdan', photo: '/images/members/herdan.jpg' },
  { id: 11, name: 'Hendi', photo: '/images/members/hendi.jpg' },
  { id: 12, name: 'Murdi', photo: '/images/members/murdi.jpg' },
  { id: 13, name: 'Uti', photo: '/images/members/uti.jpg' },
  { id: 14, name: 'Aren', photo: '/images/members/aren.jpg' },
  { id: 15, name: 'Ganex', photo: '/images/members/ganex.jpg' },
  { id: 16, name: 'Alex', photo: '/images/members/alex.jpg' },
  { id: 17, name: 'Wien', photo: '/images/members/wien.jpg' },
  { id: 18, name: 'Abdul', photo: '/images/members/abdul.jpg' },
  { id: 19, name: 'Bagas', photo: '/images/members/bagas.jpg' },
  { id: 20, name: 'Arifin', photo: '/images/members/arifin.jpg' },
  { id: 21, name: 'Iyan', photo: '/images/members/iyan.jpg' },
  { id: 22, name: 'Dedi', photo: '/images/members/dedi.jpg' },
  { id: 23, name: 'Jonathan', photo: '/images/members/jonathan.jpg' },
  { id: 24, name: 'Adi', photo: '/images/members/adi.jpg' },
  { id: 25, name: 'Ardo', photo: '/images/members/ardo.jpg' },
  { id: 26, name: 'Roy', photo: null },
  { id: 27, name: 'Edi', photo: '/images/members/edi.jpg' },
  { id: 28, name: 'Bibit', photo: '/images/members/bibit.jpg' },
  { id: 29, name: 'Fanis', photo: '/images/members/fanis.jpg' },
  { id: 30, name: 'Herry', photo: '/images/members/herry.jpg' },
  { id: 31, name: 'Dinda', photo: '/images/members/dinda.jpg' },
  { id: 32, name: 'Yogie', photo: '/images/members/yogie.jpg' },
  { id: 33, name: 'Mario', photo: '/images/members/mario.jpg' },
  { id: 34, name: 'Anthony', photo: '/images/members/anthony.jpg' },
  { id: 35, name: 'Yaya', photo: '/images/members/yaya.jpg' },
  { id: 36, name: 'Rara', photo: '/images/members/rara.jpg' },
  { id: 37, name: 'Dyas', photo: '/images/members/dyas.jpg' },
  { id: 38, name: 'Atna', photo: null },
  { id: 39, name: 'Reyza', photo: '/images/members/reyza.jpg' },
  { id: 40, name: 'Gavin', photo: '/images/members/gavin.jpg' },
  { id: 41, name: 'Gilbert', photo: null },
  { id: 42, name: 'Northon', photo: '/images/members/northon.jpg' },
  { id: 43, name: 'Agung', photo: null },
  { id: 44, name: 'Wisnu', photo: null },
  { id: 45, name: 'Ilham', photo: null },
  { id: 46, name: 'Bayu', photo: null },
  { id: 47, name: 'Yudha', photo: null },
  { id: 48, name: 'Yudi', photo: null },
  { id: 49, name: 'Daniel', photo: null },
  { id: 50, name: 'Lorenzo', photo: '/images/members/lorenzo.jpg' },
  { id: 51, name: 'Anan', photo: '/images/members/anan.jpg' },
  { id: 52, name: 'Mustofa', photo: '/images/members/mustofa.png' },
  { id: 53, name: 'Hasan Khanif', photo: '/images/members/hasan.jpg' },
  { id: 54, name: 'Ibenx', photo: null },
  { id: 55, name: 'Peno', photo: null },
  { id: 56, name: 'Bloro', photo: null },
  { id: 57, name: 'Didi', photo: null },
  { id: 58, name: 'Amin', photo: null },
  { id: 59, name: 'Darmadi', photo: null },
  { id: 60, name: 'Adnan', photo: null },
  { id: 61, name: 'Widi Setiawan', photo: null },
  { id: 62, name: 'Adrian', photo: null },
  { id: 63, name: 'Varrel', photo: null },
  { id: 64, name: 'Daus', photo: null },
  { id: 65, name: 'Dimas Yogi', photo: null },
  { id: 66, name: 'Rizky Muslim', photo: null },
  { id: 67, name: 'Yadie', photo: null },
];

export default function HallOfFameSection({ showAll = false, className = '' }: HallOfFameSectionProps) {
  const displayMembers = showAll ? hallOfFameMembers : hallOfFameMembers.slice(0, 5);

  // Calculate years since foundation
  const calculateYears = () => {
    const foundingDate = new Date(2020, 5, 16); // Month is 0-based, so 5 = June
    const today = new Date();
    const thisYearAnniversary = new Date(today.getFullYear(), 5, 16);
    
    let years = today.getFullYear() - foundingDate.getFullYear();
    
    // If we haven't reached June 16th this year, subtract one year
    if (today < thisYearAnniversary) {
      years--;
    }
    
    return years;
  };

  const yearsActive = calculateYears();

  return (
    <div className={className}>
      {!showAll && (
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Hall of Fame</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Para anggota terdepan komunitas DLOB yang telah berkontribusi membangun 
            komunitas badminton terbaik di Indonesia 🏸
          </p>
        </div>
      )}

      <div
        className={`grid gap-4 ${
          showAll 
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
        }`}
      >
        {displayMembers.map((member, index) => (
          <div
            key={member.id}
            className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full"
            style={{ 
              animationDelay: `${index * 50}ms`,
            }}
          >

            {/* Member Photo */}
            <div className="relative aspect-square overflow-hidden bg-blue-100 w-full group" style={{ minHeight: '160px' }}>
              {member.photo ? (
                <>
                  <div className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-[1.15]">
                    <SmartCropImage
                      src={member.photo}
                      alt={member.name}
                      name={member.name}
                      className=""
                    />
                  </div>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 group-hover:scale-[1.15] transition-transform duration-300 ease-out">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=400&background=3b82f6&color=fff&bold=true&font-size=0.35`}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Member Info */}
            <div className="p-3 flex-1 flex flex-col justify-center">
              <h4 className="font-semibold text-gray-900 text-center group-hover:text-blue-600 transition-colors text-sm">
                {member.name}
              </h4>
              <div className="text-center mt-1">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block">
                  DLOB Member
                </span>
              </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 ring-2 ring-blue-500 ring-opacity-0 group-hover:ring-opacity-50 transition-all duration-300 rounded-lg" />
          </div>
        ))}
      </div>

      {/* View All Button (only show on About page) */}
      {!showAll && (
        <div className="text-center mt-8">
          <a
            href="/hall-of-fame"
            className="inline-flex items-center space-x-2 bg-[#1e4843] hover:bg-[#162f2c] text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
          >
            <span>Lihat Semua Member</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      )}

      {/* Statistics (only show on full page) */}
      {showAll && (
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{hallOfFameMembers.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Member</div>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <div className="text-2xl font-bold text-green-600">{yearsActive}+</div>
            <div className="text-sm text-gray-600 mt-1">Tahun Berdiri</div>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">500+</div>
            <div className="text-sm text-gray-600 mt-1">Match Dimainkan</div>
          </div>
          <div className="text-center p-6 bg-orange-50 rounded-xl">
            <div className="text-2xl font-bold text-orange-600">100%</div>
            <div className="text-sm text-gray-600 mt-1">Semangat</div>
          </div>
        </div>
      )}
    </div>
  );
}
