'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({ 
  size = 12, 
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY
}: PupilProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

const portraits = [
  'IMG_1999.jpg', 'IMG_2035.jpg', 'IMG_2039.jpg', 'IMG_2046.jpg', 'IMG_2049.jpg',
  'IMG_2129.jpg', 'IMG_2631.jpg', 'IMG_7627.JPG', 'IMG_7631.JPG', 'IMG_7635.JPG',
  'IMG_7800.JPG', 'IMG_8028.JPG', 'IMG_8861.JPG', 'IMG_8865.JPG', 'IMG_8873.JPG'
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [bgImage, setBgImage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);
  const { signIn, signInWithGoogle } = useAuth();

  // Check for OAuth errors from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlError = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const description = searchParams.get('description');
    const code = searchParams.get('code');
    
    // Only process if there's actually an error parameter
    if (urlError === null) {
      // No error parameter at all - normal page load or OAuth with code
      return;
    }
    
    // Error parameter exists - check if it has content
    // Handle empty or whitespace-only error parameters
    if (urlError === '' || urlError.trim() === '') {
      console.warn('⚠️ [Login] Empty error parameter - likely redirect configuration issue');
      setError('Terjadi kesalahan saat login. Silakan coba lagi atau gunakan email & password.');
      window.history.replaceState({}, '', '/login');
      return;
    }
    
    // Valid error with content
    const errorMessages: Record<string, string> = {
      'access_denied': 'Login dibatalkan. Anda menolak akses ke Google.',
      'auth': 'Autentikasi gagal. Silakan coba lagi.',
      'server_error': 'Terjadi kesalahan server. Silakan coba lagi.',
      'no_session': 'Sesi tidak dapat dibuat. Silakan coba lagi.',
      'missing_code': 'Kode autentikasi tidak ditemukan. Silakan coba lagi.',
      'unauthorized_client': 'Aplikasi tidak diotorisasi. Hubungi administrator.',
      'invalid_request': 'Permintaan tidak valid. Silakan coba lagi.',
      'redirect_uri_mismatch': 'URL redirect tidak cocok. Hubungi administrator.',
      'unknown_oauth_error': 'Terjadi kesalahan OAuth yang tidak diketahui.',
    };
    
    console.error('❌ [Login] OAuth error:', urlError, {
      errorDescription: errorDescription,
      description: description,
    });
    
    const errorMessage = errorMessages[urlError] || 
                         errorDescription || 
                         description || 
                         `Login gagal: ${urlError}. Silakan coba lagi.`;
    
    setError(errorMessage);
    window.history.replaceState({}, '', '/login');
  }, []);

  // Check for success messages (like after profile completion)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const message = searchParams.get('message');
    
    if (message === 'please-verify-email') {
      setSuccessMessage('✅ Profil berhasil diperbarui! Email verifikasi telah dikirim ke inbox Anda. Silakan klik link verifikasi terlebih dahulu, kemudian login dengan email dan password baru Anda.');
      window.history.replaceState({}, '', '/login');
    } else if (message === 'email-verified') {
      setSuccessMessage('✅ Email berhasil diverifikasi! Sekarang Anda dapat login dengan email dan password baru Anda.');
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  useEffect(() => {
    const randomImage = portraits[Math.floor(Math.random() * portraits.length)];
    setBgImage(`/images/potrait/${randomImage}`);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking effects
  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
      return blinkTimeout;
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
      return blinkTimeout;
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => setIsPurplePeeking(false), 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };
      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword, isPurplePeeking]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      // Don't set loading to false here - user will be redirected
    } catch (err: any) {
      console.error('❌ [Login] Google login error:', {
        message: err?.message,
        name: err?.name,
        status: err?.status,
        details: err,
      });
      
      let errorMessage = 'Login dengan Google gagal. Silakan coba lagi.';
      
      // Handle specific error types
      if (err?.message) {
        if (err.message.includes('popup')) {
          errorMessage = 'Pop-up diblokir. Mohon izinkan pop-up untuk situs ini.';
        } else if (err.message.includes('network')) {
          errorMessage = 'Koneksi internet bermasalah. Periksa koneksi Anda.';
        } else if (err.message.includes('unauthorized')) {
          errorMessage = 'Aplikasi tidak diotorisasi. Hubungi administrator.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
      {/* Background Image */}
      {bgImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImage}
            alt="Background"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/80 via-zinc-950/60 to-zinc-950/80" />
        </div>
      )}
      
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Animated Characters Section */}
        <div className="hidden lg:flex relative h-[600px] items-center justify-center">
          {/* Purple Character - Tall Rectangle */}
          <div
            ref={purpleRef}
            className="absolute left-12 top-20 transition-transform duration-300"
            style={{ transform: `skewY(${purplePos.bodySkew}deg)` }}
          >
            <div
              className="relative bg-purple-500 rounded-3xl flex flex-col items-center justify-start pt-8 transition-all duration-300"
              style={{
                width: "180px",
                height: "400px",
                transform: `translate(${purplePos.faceX}px, ${purplePos.faceY}px)`,
              }}
            >
              <div className="flex gap-6">
                <EyeBall
                  size={isPurplePeeking ? 50 : 45}
                  pupilSize={isPurplePeeking ? 20 : 16}
                  eyeColor="white"
                  isBlinking={isPurpleBlinking}
                  forceLookX={isLookingAtEachOther ? 50 : undefined}
                  forceLookY={isLookingAtEachOther ? 0 : undefined}
                />
                <EyeBall
                  size={isPurplePeeking ? 50 : 45}
                  pupilSize={isPurplePeeking ? 20 : 16}
                  eyeColor="white"
                  isBlinking={isPurpleBlinking}
                  forceLookX={isLookingAtEachOther ? 50 : undefined}
                  forceLookY={isLookingAtEachOther ? 0 : undefined}
                />
              </div>
            </div>
          </div>

          {/* Black Character - Tall Rectangle */}
          <div
            ref={blackRef}
            className="absolute right-12 top-32 transition-transform duration-300"
            style={{ transform: `skewY(${blackPos.bodySkew}deg)` }}
          >
            <div
              className="relative bg-zinc-800 rounded-3xl flex flex-col items-center justify-start pt-8 transition-all duration-300"
              style={{
                width: "120px",
                height: "310px",
                transform: `translate(${blackPos.faceX}px, ${blackPos.faceY}px)`,
              }}
            >
              <div className="flex gap-4">
                <EyeBall
                  size={35}
                  pupilSize={14}
                  eyeColor="white"
                  isBlinking={isBlackBlinking}
                  forceLookX={isLookingAtEachOther ? -50 : undefined}
                  forceLookY={isLookingAtEachOther ? 0 : undefined}
                />
                <EyeBall
                  size={35}
                  pupilSize={14}
                  eyeColor="white"
                  isBlinking={isBlackBlinking}
                  forceLookX={isLookingAtEachOther ? -50 : undefined}
                  forceLookY={isLookingAtEachOther ? 0 : undefined}
                />
              </div>
            </div>
          </div>

          {/* Orange Character - Semi-circle */}
          <div
            ref={orangeRef}
            className="absolute bottom-12 left-24 transition-transform duration-300"
            style={{ transform: `skewY(${orangePos.bodySkew}deg)` }}
          >
            <div
              className="relative bg-orange-500 flex items-start justify-center pt-12 transition-all duration-300"
              style={{
                width: "240px",
                height: "200px",
                borderRadius: "120px 120px 0 0",
                transform: `translate(${orangePos.faceX}px, ${orangePos.faceY}px)`,
              }}
            >
              <div className="flex gap-12">
                <div className="w-6 h-6 relative">
                  <Pupil size={12} maxDistance={6} pupilColor="#27272a" />
                </div>
                <div className="w-6 h-6 relative">
                  <Pupil size={12} maxDistance={6} pupilColor="#27272a" />
                </div>
              </div>
            </div>
          </div>

          {/* Yellow Character - Rounded Rectangle */}
          <div
            ref={yellowRef}
            className="absolute bottom-12 right-32 transition-transform duration-300"
            style={{ transform: `skewY(${yellowPos.bodySkew}deg)` }}
          >
            <div
              className="relative bg-yellow-400 rounded-[60px] flex flex-col items-center justify-start pt-12 gap-6 transition-all duration-300"
              style={{
                width: "140px",
                height: "230px",
                transform: `translate(${yellowPos.faceX}px, ${yellowPos.faceY}px)`,
              }}
            >
              <div className="flex gap-8">
                <div className="w-6 h-6 relative">
                  <Pupil size={12} maxDistance={6} pupilColor="#27272a" />
                </div>
                <div className="w-6 h-6 relative">
                  <Pupil size={12} maxDistance={6} pupilColor="#27272a" />
                </div>
              </div>
              <div className="w-16 h-0.5 bg-zinc-800 rounded-full" />
            </div>
          </div>
        </div>

        {/* Login Form Section */}
        <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20 mx-auto lg:mx-0">
          <div>
            <h2 className="text-center text-3xl font-bold text-white">
              Masuk ke DLOB
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              Belum punya akun?{' '}
              <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300">
                Daftar sekarang
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  className="w-full px-3 py-2 border border-gray-300/20 placeholder-gray-400 text-white bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    className="w-full px-3 py-2 border border-gray-300/20 placeholder-gray-400 text-white bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
            </div>

            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-300">Atau</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300/20 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
              <p className="text-xs text-blue-200 text-center">
                💡 <strong>Tips:</strong> Jika Anda mendaftar menggunakan Google, gunakan tombol Google untuk login.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
