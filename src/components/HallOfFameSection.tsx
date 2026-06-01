'use client';

import React, { useState, useEffect } from 'react';
import SmartCropImage from '@/components/SmartCropImage';

interface Member {
  id: number;
  name: string;
  photo: string | null;
  supabasePhoto?: string | null;
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
  { id: 5, name: 'Adit', photo: '/images/members/adit.jpg', supabasePhoto: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/profiles/259d2fb4-fa8a-4abb-b504-ff6e0ad5afd2-1771187703573.JPG' },
  { id: 6, name: 'Kiki', photo: '/images/members/kiki.jpg' },
  { id: 7, name: 'Zaka', photo: '/images/members/zaka.jpg' },
  { id: 8, name: 'Dimas', photo: '/images/members/dimas.jpg' },
  { id: 9, name: 'Eka', photo: '/images/members/eka.jpg' },
  { id: 10, name: 'Herdan', photo: '/images/members/herdan.jpg', supabasePhoto: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/profiles/ad6234cd-65b0-4089-bd58-650b28434b9e-1772899081801.jpg' },
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
  { id: 26, name: 'Roy', photo: '/images/members/roy.jpeg' },
  { id: 27, name: 'Edi', photo: '/images/members/edi.jpg' },
  { id: 28, name: 'Bibit', photo: '/images/members/bibit.jpg' },
  { id: 29, name: 'Fanis', photo: '/images/members/fanis.jpg' },
  { id: 30, name: 'Herry', photo: '/images/members/herry.jpg' },
  { id: 31, name: 'Dinda', photo: '/images/members/dinda.jpg' },
  { id: 32, name: 'Yogie', photo: '/images/members/yogie.jpg', supabasePhoto: 'https://lh3.googleusercontent.com/a/ACg8ocIw52CH6Mae6p28BhBLeKdftetxslt8i-VvQpU5BTX9qh5uHEVm=s96-c' },
  { id: 33, name: 'Mario', photo: '/images/members/mario.jpg' },
  { id: 34, name: 'Anthony', photo: '/images/members/anthony.jpg' },
  { id: 35, name: 'Yaya', photo: '/images/members/yaya.jpg' },
  { id: 36, name: 'Rara', photo: '/images/members/rara.jpg' },
  { id: 37, name: 'Dyas', photo: null },
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
  { id: 48, name: 'Yudi', photo: '/images/members/yudi.jpeg' },
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
  { id: 64, name: 'Daus', photo: null, supabasePhoto: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/profiles/aada4fc2-ac1c-42b0-a798-6315920b6690-1772891005157.jpeg' },
  { id: 65, name: 'Dimas Yogi', photo: null },
  { id: 66, name: 'Rizky Muslim', photo: null },
  { id: 67, name: 'Yadie', photo: null },
  { id: 68, name: 'Roba Laoli', photo: null, supabasePhoto: 'https://lh3.googleusercontent.com/a/ACg8ocIkxIl1UnbSw-gYXffhVzmPvOakZ0l4XjUSqTeYpc9JGnusbw=s96-c' },
  { id: 69, name: 'Risky MP', photo: null },
  { id: 70, name: 'Alvin', photo: null },
  { id: 71, name: 'Agus', photo: null },
  { id: 72, name: 'Sandy', photo: null },
  { id: 73, name: 'Ferry', photo: null },
  { id: 74, name: 'Mawan', photo: null },
  { id: 75, name: 'Dodi', photo: null },
  { id: 76, name: 'Bolem', photo: null },
  { id: 77, name: 'Brian', photo: null },
  { id: 78, name: 'Revan', photo: null },
  { id: 79, name: 'Vikri', photo: null },
  { id: 80, name: 'Saiful', photo: null },
  { id: 81, name: 'Austin', photo: null },
  { id: 82, name: 'Pipih', photo: null },
  { id: 83, name: 'Fahri', photo: null },
  { id: 84, name: 'Aris', photo: null },
  { id: 85, name: 'Kopral', photo: null },
  { id: 86, name: 'Pak Haji Nur', photo: null },
  { id: 87, name: 'Romi', photo: null },
  { id: 88, name: 'Bian', photo: null },
  { id: 89, name: 'Giri', photo: null },
  { id: 90, name: 'Faruq', photo: null },
  { id: 91, name: 'Fandi', photo: null },
  { id: 92, name: 'Juki', photo: null },
  { id: 93, name: 'Diva', photo: null },
  { id: 94, name: 'Taryono', photo: null },
  { id: 95, name: 'Udin', photo: null },
  { id: 96, name: 'Aam', photo: null },
  { id: 97, name: 'Arda', photo: null },
  { id: 98, name: 'Bara', photo: null },
  { id: 99, name: 'Putra', photo: null },
  { id: 100, name: 'Juan', photo: null },
  { id: 101, name: 'Sams', photo: null },
];

export default function HallOfFameSection({ showAll = false, className = '' }: HallOfFameSectionProps) {
  const displayMembers = showAll ? hallOfFameMembers : hallOfFameMembers.slice(0, 5);

  return (
    <div className={className}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes glitch-slice-1 {
          0% { clip-path: inset(40% 0 61% 0); transform: skew(-3deg) translate(-10px, -5px); filter: hue-rotate(90deg) saturate(1.5); }
          20% { clip-path: inset(92% 0 1% 0); transform: skew(2deg) translate(8px, 6px); filter: none; }
          40% { clip-path: inset(15% 0 80% 0); transform: skew(-2deg) translate(-6px, 4px); filter: hue-rotate(-60deg) saturate(2); }
          60% { clip-path: inset(80% 0 5% 0); transform: skew(4deg) translate(10px, -6px); filter: none; }
          80% { clip-path: inset(3% 0 92% 0); transform: skew(-1deg) translate(-4px, 2px); filter: hue-rotate(180deg) saturate(1.2); }
          100% { clip-path: inset(40% 0 61% 0); transform: skew(-3deg) translate(-10px, -5px); filter: hue-rotate(90deg) saturate(1.5); }
        }
        @keyframes glitch-slice-2 {
          0% { clip-path: inset(25% 0 58% 0); transform: skew(5deg) translate(8px, 4px); filter: hue-rotate(-90deg) saturate(2); }
          20% { clip-path: inset(70% 0 20% 0); transform: skew(-3deg) translate(-10px, -2px); filter: none; }
          40% { clip-path: inset(5% 0 85% 0); transform: skew(2deg) translate(4px, -6px); filter: hue-rotate(60deg) saturate(1.5); }
          60% { clip-path: inset(50% 0 40% 0); transform: skew(-4deg) translate(-8px, 8px); filter: none; }
          80% { clip-path: inset(85% 0 10% 0); transform: skew(3deg) translate(10px, -4px); filter: hue-rotate(-180deg) saturate(1.8); }
          100% { clip-path: inset(25% 0 58% 0); transform: skew(5deg) translate(8px, 4px); filter: hue-rotate(-90deg) saturate(2); }
        }
        @keyframes glitch-flicker {
          0%, 100% { opacity: 0.95; }
          10% { opacity: 0.4; }
          15% { opacity: 0.9; }
          25% { opacity: 0.25; }
          30% { opacity: 0.98; }
          45% { opacity: 0.35; }
          50% { opacity: 0.95; }
          65% { opacity: 0.2; }
          70% { opacity: 0.85; }
          85% { opacity: 0.98; }
          90% { opacity: 0.45; }
        }
      `}} />

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
          <MemberCard key={member.id} member={member} index={index} />
        ))}
      </div>

      {/* View All Button (only show on About page) */}
      {!showAll && (
        <div className="text-center mt-8">
          <a
            href="/hall-of-fame"
            className="inline-flex items-center space-x-2 bg-[#1e4843] hover:bg-[#162f2c] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
          >
            <span>Lihat Semua Member</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      )}

    </div>
  );
}

function MemberCard({ member, index }: { member: Member; index: number }) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0); // 0 = primary, 1 = secondary
  const [isGlitched, setIsGlitched] = useState(false);

  const primaryPhoto = member.photo;
  const secondaryPhoto = member.supabasePhoto || null;

  useEffect(() => {
    if (!secondaryPhoto) return;

    let mainTimeoutId: NodeJS.Timeout | null = null;
    let swapTimeoutId: NodeJS.Timeout | null = null;
    let endGlitchTimeoutId: NodeJS.Timeout | null = null;
    let startTimeoutId: NodeJS.Timeout | null = null;

    const initialDelay = index * 250 + Math.random() * 500;

    const runGlitchCycle = (currentActiveIndex: number) => {
      const nextIndex = currentActiveIndex === 0 ? 1 : 0;
      // If we are transitioning to 1 (secondary), stay for 10s. If transitioning to 0 (primary), stay for 30s.
      const delayForNextState = nextIndex === 1 ? 10000 : 30000;

      setIsGlitched(true);
      
      swapTimeoutId = setTimeout(() => {
        setActivePhotoIndex(nextIndex);
      }, 600);

      endGlitchTimeoutId = setTimeout(() => {
        setIsGlitched(false);
        
        mainTimeoutId = setTimeout(() => {
          runGlitchCycle(nextIndex);
        }, delayForNextState - 1200);
      }, 1200);
    };

    // Initial wait of 30 seconds (plus stagger delay) before transitioning to secondary image
    startTimeoutId = setTimeout(() => {
      runGlitchCycle(0);
    }, 30000 + initialDelay);

    return () => {
      if (startTimeoutId) clearTimeout(startTimeoutId);
      if (mainTimeoutId) clearTimeout(mainTimeoutId);
      if (swapTimeoutId) clearTimeout(swapTimeoutId);
      if (endGlitchTimeoutId) clearTimeout(endGlitchTimeoutId);
    };
  }, [secondaryPhoto, index]);

  const currentPhoto = activePhotoIndex === 0 ? primaryPhoto : secondaryPhoto;
  const nextPhoto = activePhotoIndex === 0 ? secondaryPhoto : primaryPhoto;

  return (
    <div
      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-800/10 hover:border-neutral-700/20 shadow-xs hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full bg-neutral-900"
      style={{ 
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Background Image / Gradient */}
      <div className="w-full h-full absolute inset-0 overflow-hidden bg-neutral-950">
        {/* Layer 1: Current Photo (or Initial/Default Gradient if null) */}
        {currentPhoto ? (
          <div className={`w-full h-full absolute inset-0 transition-all duration-500 ease-out group-hover:scale-105 ${isGlitched ? 'opacity-20 scale-95 blur-[2px]' : 'opacity-100'}`}>
            <SmartCropImage
              src={currentPhoto}
              alt={member.name}
              name={member.name}
              className=""
            />
          </div>
        ) : (
          <div className={`w-full h-full absolute inset-0 bg-gradient-to-br from-[#1e4843] via-[#162f2c] to-[#0f1d1b] transition-transform duration-700 ease-out group-hover:scale-105 flex items-center justify-center ${isGlitched ? 'opacity-20 scale-95' : 'opacity-100'}`}>
            <span className="text-7xl font-serif font-bold text-white/5 select-none">
              {member.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Glitch Overlay Layers: Only render/animate when isGlitched is active */}
        {isGlitched && (nextPhoto || currentPhoto) && (
          <>
            {/* Layer 2: Glitched Image - Red Split/Slice */}
            <div 
              className="w-full h-full absolute inset-0 z-2 pointer-events-none"
              style={{
                animation: 'glitch-slice-1 0.4s linear infinite, glitch-flicker 0.15s infinite',
              }}
            >
              <SmartCropImage
                src={(nextPhoto || currentPhoto) as string}
                alt={member.name}
                name={member.name}
                className="brightness-125 contrast-125"
              />
            </div>

            {/* Layer 3: Glitched Image - Blue/Cyan Split/Slice */}
            <div 
              className="w-full h-full absolute inset-0 z-3 pointer-events-none"
              style={{
                animation: 'glitch-slice-2 0.3s linear infinite, glitch-flicker 0.25s infinite',
              }}
            >
              <SmartCropImage
                src={(nextPhoto || currentPhoto) as string}
                alt={member.name}
                name={member.name}
                className="brightness-110 contrast-150"
              />
            </div>
            
            {/* Chromatic aberration overlay blocks */}
            <div className="absolute inset-0 bg-red-500/20 mix-blend-color z-4 pointer-events-none animate-pulse" />
            <div className="absolute inset-0 bg-cyan-500/10 mix-blend-color z-4 pointer-events-none animate-pulse" style={{ animationDelay: '0.1s' }} />
          </>
        )}
      </div>

      {/* Elegant Dark Gradient overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 transition-opacity duration-300 group-hover:from-black/90 pointer-events-none z-1" />

      {/* Inset White Border Outline Frame */}
      <div className="absolute inset-3 border border-white/15 rounded-xl transition-all duration-500 group-hover:border-white/30 pointer-events-none z-10" />

      {/* Top Left Profile Logo */}
      <div className="absolute top-5 left-5 z-10 transition-transform duration-500 group-hover:translate-x-0.5">
        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
          <span className="text-[9px] font-bold text-[#1e4843]">
            {member.name.charAt(0)}
          </span>
        </div>
      </div>

      {/* Bottom Profile Info */}
      <div className="absolute bottom-6 left-6 right-6 flex flex-col items-center text-center z-10 transition-transform duration-500 group-hover:translate-y-[-2px]">
        <span className="text-[8px] text-white/50 font-bold tracking-widest uppercase mb-1">
          DLOB Member
        </span>
        <h4 className="text-base md:text-lg font-semibold text-white tracking-wide">
          {member.name}
        </h4>
      </div>
    </div>
  );
}
