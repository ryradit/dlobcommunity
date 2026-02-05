'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function GallerySection() {
  const router = useRouter();
  const [secretIndexes, setSecretIndexes] = useState<number[]>([]);

  // Randomly select 2 secret images on component mount
  useEffect(() => {
    const totalImages = 6;
    const numSecrets = 2;
    const randomIndexes: number[] = [];
    
    while (randomIndexes.length < numSecrets) {
      const randomIndex = Math.floor(Math.random() * totalImages);
      if (!randomIndexes.includes(randomIndex)) {
        randomIndexes.push(randomIndex);
      }
    }
    
    setSecretIndexes(randomIndexes);
  }, []);

  const handleImageClick = (idx: number) => {
    if (secretIndexes.includes(idx)) {
      router.push('/versus-game');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900&display=swap');
    
        * {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      <section id="gallery" className="w-full flex flex-col items-center justify-start py-12">
        <div className="max-w-3xl text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Koleksi Foto Terbaik</h1>
          <p className="text-base md:text-lg text-gray-600 mt-3">
            Saksikan momen-momen terbaik dari pertandingan dan latihan badminton kami. 
            Setiap foto menceritakan kisah dedikasi dan semangat tim DLOB.
          </p>
        </div>

        {/* Gallery */}
        <div className="flex items-center gap-2 h-[400px] w-full max-w-5xl mt-10 px-4">
          {[
            "/images/potrait/IMG_1999.jpg",
            "/images/potrait/IMG_2039.jpg",
            "/images/potrait/IMG_2046.jpg",
            "/images/potrait/IMG_2035.jpg",
            "/images/potrait/IMG_2049.jpg",
            "/images/potrait/IMG_2129.jpg",
          ].map((src, idx) => (
            <div
              key={idx}
              onClick={() => handleImageClick(idx)}
              className={`relative group flex-grow transition-all w-56 rounded-lg overflow-hidden h-[400px] duration-500 hover:w-full ${
                secretIndexes.includes(idx) ? 'cursor-pointer' : ''
              }`}
            >
              <img
                className="h-full w-full object-cover object-center"
                src={src}
                alt={`image-${idx}`}
              />
              
              {/* Secret indicator - only visible on hover for secret images */}
              {secretIndexes.includes(idx) && (
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="text-sm font-semibold">Something special...</span>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
