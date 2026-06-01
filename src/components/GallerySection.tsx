'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900&display=swap');
    
        * {
          font-family: 'Poppins', sans-serif;
        }

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
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .flip-card-back {
          transform: rotateY(180deg);
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
          {featuredImages.map((_, idx) => (
            <div
              key={idx}
              onClick={() => handleImageClick(idx)}
              className={`relative group flex-grow transition-all w-56 h-[400px] duration-500 hover:w-full perspective-container ${
                secretIndexes.includes(idx) ? 'cursor-pointer' : ''
              }`}
            >
              <div
                className="flip-card-inner"
                style={{
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transitionDelay: `${idx * 150}ms`,
                }}
              >
                {/* Front Face (Featured Images) */}
                <div className="flip-card-face">
                  <img
                    className="h-full w-full object-cover object-center"
                    src={featuredImages[idx]}
                    alt={`featured-${idx}`}
                  />
                  {secretIndexes.includes(idx) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6 z-10">
                      <div className="flex items-center gap-2 text-white">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        <span className="text-sm font-semibold">Something special...</span>
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Back Face (Portrait Images) */}
                <div className="flip-card-face flip-card-back">
                  <img
                    className="h-full w-full object-cover object-center"
                    src={portraitImages[idx]}
                    alt={`portrait-${idx}`}
                  />
                  {secretIndexes.includes(idx) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6 z-10">
                      <div className="flex items-center gap-2 text-white">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        <span className="text-sm font-semibold">Something special...</span>
                        <Sparkles className="w-5 h-5 animate-pulse" />
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
