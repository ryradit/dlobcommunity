'use client';

import React from 'react';
import Image from 'next/image';
import SmartCropImage from '@/components/SmartCropImage';

interface Member {
  id: number;
  name: string;
  photo: string;
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
  { id: 26, name: 'Roy', photo: '/images/members/roy.jpg' },
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
  { id: 38, name: 'Atna', photo: '/images/members/atna.jpg' },
  { id: 39, name: 'Reyza', photo: '/images/members/reyza.jpg' },
  { id: 40, name: 'Gavin', photo: '/images/members/gavin.jpg' },
  { id: 41, name: 'Gilbert', photo: '/images/members/gilbert.jpg' },
  { id: 42, name: 'Northon', photo: '/images/members/northon.jpg' },
  { id: 43, name: 'Agung', photo: '/images/members/agung.jpg' },
  { id: 44, name: 'Wisnu', photo: '/images/members/wisnu.jpg' },
  { id: 45, name: 'Ilham', photo: '/images/members/ilham.jpg' },
  { id: 46, name: 'Bayu', photo: '/images/members/bayu.jpg' },
  { id: 47, name: 'Yudha', photo: '/images/members/yudha.jpg' },
  { id: 48, name: 'Yudi', photo: '/images/members/yudi.jpg' },
  { id: 49, name: 'Daniel', photo: '/images/members/daniel.jpg' },
  { id: 50, name: 'Lorenzo', photo: '/images/members/lorenzo.jpg' }
    ,{ id: 51, name: 'Dyas', photo: '/images/members/dyas.jpg' }
    ,{ id: 52, name: 'Anan', photo: '/images/members/anan.jpg' }
];

export default function HallOfFameSection({ showAll = false, className = '' }: HallOfFameSectionProps) {
  const displayMembers = showAll ? hallOfFameMembers : hallOfFameMembers.slice(0, 5);

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
        className={`grid gap-6 ${
          showAll 
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
        }`}
      >
        {displayMembers.map((member, index) => (
          <div
            key={member.id}
            className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 flex flex-col"
            style={{ 
              animationDelay: `${index * 100}ms`,
              minHeight: '280px', // Ensures consistent card height
              maxWidth: '300px',  // Prevents cards from getting too wide
              margin: '0 auto'    // Centers cards in their grid cells
            }}
          >
            {/* Member Photo */}
            <div className="relative aspect-square overflow-hidden bg-blue-100" style={{ minHeight: '200px', maxHeight: '300px' }}>
              <SmartCropImage
                src={member.photo}
                alt={member.name}
                name={member.name}
                className={`group-hover:scale-125 transition-transform duration-500 ease-out w-full h-full
                  ${member.name === 'Reyza' ? 'scale-85 -translate-y-2' : ''} 
                  ${member.name === 'Northon' ? 'translate-y-2' : ''}
                  ${member.name === 'Edi' ? 'scale-90 translate-y-2' : ''}
                  ${member.name === 'Yaya' ? 'scale-80 -translate-y-13' : ''}
                  ${member.name === 'Anthony' ? 'scale-80 translate-y-1' : ''}`}
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Member Info */}
            <div className="p-4 flex-1 flex flex-col justify-center min-h-20">
              <h4 className="font-semibold text-gray-900 text-center group-hover:text-blue-600 transition-colors text-sm md:text-base">
                {member.name}
              </h4>
              <div className="text-center mt-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  DLOB Member
                </span>
              </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 ring-2 ring-blue-500 ring-opacity-0 group-hover:ring-opacity-50 transition-all duration-300 rounded-xl" />
          </div>
        ))}
      </div>

      {/* View All Button (only show on About page) */}
      {!showAll && (
        <div className="text-center mt-8">
          <a
            href="/hall-of-fame"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
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
            <div className="text-2xl font-bold text-green-600">5+</div>
            <div className="text-sm text-gray-600 mt-1">Tahun Berdiri</div>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">200+</div>
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