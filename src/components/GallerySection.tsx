'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Camera } from 'lucide-react';

export default function GallerySection() {
  const router = useRouter();
  const [secretIndexes, setSecretIndexes] = useState<number[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);

  const featuredImages = [
    // 3 Left
    "/images/image featured/DSC01498_1.JPG",
    "/images/image featured/DSC02183.JPG",
    "/images/image featured/DSC02213.JPG",
    // 3 Right (the rest)
    "/images/image featured/DSC01506_1.JPG",
    "/images/image featured/DSC01555_1.JPG",
    "/images/image featured/DSC02303.JPG",
  ];

  const portraitImages = [
    "/images/potrait/IMG_1999.jpg",
    "/images/potrait/IMG_2039.jpg",
    "/images/potrait/IMG_2046.jpg",
    "/images/potrait/IMG_2035.jpg",
    "/images/potrait/IMG_2049.jpg",
    "/images/potrait/IMG_2129.jpg",
  ];

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

  // Toggle flipped state every 20 seconds to transition between image sets
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const handleImageClick = (idx: number) => {
    if (secretIndexes.includes(idx)) {
      router.push('/versus-game');
    }
  };

  return (
    <>
      <style>{`
        .perspective-container {
          perspective: 1200px;
        }

        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .flip-card-face {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 1.5rem;
          overflow: hidden;
        }

        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>

      <section id="gallery" className="w-full flex flex-col items-center justify-start py-24 bg-slate-50 relative overflow-hidden">
        {/* Background Decorative Emojis/Patterns */}
        <div className="absolute top-20 left-10 text-9xl opacity-5 select-none pointer-events-none">📷</div>
        <div className="absolute bottom-20 right-10 text-9xl opacity-5 select-none pointer-events-none">✨</div>

        <div className="max-w-3xl text-center px-4 mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-extrabold border border-teal-100 tracking-wider uppercase">
            <Camera className="w-3.5 h-3.5" /> GALERI AKTIVITAS
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
            Koleksi Foto Terbaik
          </h2>
          <p className="text-base text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
            Saksikan momen-momen terbaik dari pertandingan dan latihan badminton kami. Setiap foto menceritakan kisah dedikasi dan semangat tim DLOB.
          </p>
        </div>

        {/* Gallery - Expandable cards */}
        <div className="flex flex-col md:flex-row items-center gap-4 min-h-[420px] w-full max-w-5xl px-4">
          {featuredImages.map((_, idx) => (
            <div
              key={idx}
              onClick={() => handleImageClick(idx)}
              className={`relative group flex-1 transition-all duration-500 md:hover:flex-[3.5] w-full md:w-auto h-[420px] perspective-container cursor-pointer`}
            >
              <div
                className="flip-card-inner shadow-lg hover:shadow-2xl rounded-3xl"
                style={{
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transitionDelay: `${idx * 100}ms`,
                }}
              >
                {/* Front Face (Featured Images) */}
                <div className="flip-card-face border border-gray-200/50">
                  <img
                    className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    src={featuredImages[idx]}
                    alt={`featured-${idx}`}
                  />
                  {secretIndexes.includes(idx) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8 z-10">
                      <div className="flex items-center gap-2 text-white bg-teal-800/80 backdrop-blur-md px-4 py-2 rounded-full border border-teal-500/30 shadow-lg">
                        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                        <span className="text-xs font-extrabold uppercase tracking-wider">Something special...</span>
                        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Back Face (Portrait Images) */}
                <div className="flip-card-face flip-card-back border border-gray-200/50">
                  <img
                    className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    src={portraitImages[idx]}
                    alt={`portrait-${idx}`}
                  />
                  {secretIndexes.includes(idx) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8 z-10">
                      <div className="flex items-center gap-2 text-white bg-teal-800/80 backdrop-blur-md px-4 py-2 rounded-full border border-teal-500/30 shadow-lg">
                        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                        <span className="text-xs font-extrabold uppercase tracking-wider">Something special...</span>
                        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
