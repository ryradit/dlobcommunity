'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number;
  code: number;
  city: string;
}

type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'drizzle';

function getWeatherType(code: number): WeatherType {
  if (code === 0) return 'sunny';
  if (code <= 3) return 'cloudy';
  if (code <= 48) return 'cloudy';
  if (code <= 67) return 'drizzle';
  if (code <= 77) return 'drizzle';
  if (code <= 82) return 'rainy';
  return 'stormy';
}

function getWeatherLabel(code: number): string {
  if (code === 0) return 'Cerah';
  if (code <= 2) return 'Cerah Berawan';
  if (code <= 3) return 'Berawan';
  if (code <= 48) return 'Berkabut';
  if (code <= 57) return 'Gerimis';
  if (code <= 67) return 'Hujan';
  if (code <= 77) return 'Hujan Salju';
  if (code <= 82) return 'Hujan Deras';
  return 'Badai Petir';
}

// --- Animated scene components -----------------------------------------------

function SunScene() {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      {/* Rays */}
      <div className="absolute inset-0 flex items-center justify-center animate-spin" style={{ animationDuration: '8s' }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-3 bg-yellow-300 rounded-full origin-bottom"
            style={{
              transform: `rotate(${i * 45}deg) translateY(-22px)`,
              opacity: 0.8,
            }}
          />
        ))}
      </div>
      {/* Sun core */}
      <div className="w-7 h-7 rounded-full bg-yellow-400 shadow-lg shadow-yellow-200" />
    </div>
  );
}

function CloudScene() {
  return (
    <div className="relative w-14 h-14 flex items-end justify-center pb-1">
      {/* Back cloud */}
      <div
        className="absolute w-9 h-5 bg-gray-300 dark:bg-gray-500 rounded-full"
        style={{ bottom: 10, left: 2, opacity: 0.7 }}
      />
      {/* Front cloud */}
      <div className="relative w-11 h-6 bg-white dark:bg-gray-300 rounded-full shadow-md">
        <div className="absolute -top-3 left-2 w-5 h-5 bg-white dark:bg-gray-300 rounded-full" />
        <div className="absolute -top-2 left-5 w-4 h-4 bg-white dark:bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}

function DrizzleScene() {
  const drops = [
    { left: 15, delay: 0, dur: 0.8 },
    { left: 30, delay: 0.3, dur: 0.9 },
    { left: 45, delay: 0.15, dur: 0.7 },
    { left: 60, delay: 0.5, dur: 0.85 },
    { left: 75, delay: 0.1, dur: 0.75 },
  ];
  return (
    <div className="relative w-14 h-14 overflow-hidden">
      {/* Cloud */}
      <div className="absolute top-1 left-1 w-11 h-6 bg-gray-400 dark:bg-gray-500 rounded-full shadow">
        <div className="absolute -top-2 left-2 w-5 h-5 bg-gray-400 dark:bg-gray-500 rounded-full" />
        <div className="absolute -top-1.5 left-5 w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded-full" />
      </div>
      {/* Drizzle drops */}
      {drops.map((d, i) => (
        <div
          key={i}
          className="absolute w-0.5 rounded-full bg-blue-300"
          style={{
            left: `${d.left}%`,
            top: '55%',
            height: 6,
            animation: `rain-fall ${d.dur}s ${d.delay}s infinite linear`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

function RainScene() {
  const drops = [
    { left: 10, delay: 0,    dur: 0.6, h: 10 },
    { left: 22, delay: 0.2,  dur: 0.55, h: 12 },
    { left: 35, delay: 0.1,  dur: 0.65, h: 9  },
    { left: 48, delay: 0.4,  dur: 0.6,  h: 11 },
    { left: 60, delay: 0.05, dur: 0.5,  h: 10 },
    { left: 72, delay: 0.3,  dur: 0.6,  h: 12 },
    { left: 82, delay: 0.15, dur: 0.55, h: 9  },
  ];
  return (
    <div className="relative w-14 h-14 overflow-hidden">
      {/* Dark cloud */}
      <div className="absolute top-0 left-0 w-12 h-6 bg-gray-500 dark:bg-gray-600 rounded-full shadow-md">
        <div className="absolute -top-2 left-2 w-5 h-5 bg-gray-500 dark:bg-gray-600 rounded-full" />
        <div className="absolute -top-1.5 left-5 w-4 h-4 bg-gray-500 dark:bg-gray-600 rounded-full" />
      </div>
      {drops.map((d, i) => (
        <div
          key={i}
          className="absolute w-0.5 rounded-full bg-blue-400"
          style={{
            left: `${d.left}%`,
            top: '48%',
            height: d.h,
            animation: `rain-fall ${d.dur}s ${d.delay}s infinite linear`,
          }}
        />
      ))}
    </div>
  );
}

function StormScene() {
  const drops = [
    { left: 8,  delay: 0,    dur: 0.5, h: 12 },
    { left: 20, delay: 0.15, dur: 0.45, h: 14 },
    { left: 33, delay: 0.05, dur: 0.5,  h: 12 },
    { left: 46, delay: 0.3,  dur: 0.48, h: 13 },
    { left: 58, delay: 0.1,  dur: 0.5,  h: 12 },
    { left: 70, delay: 0.25, dur: 0.45, h: 14 },
    { left: 82, delay: 0.08, dur: 0.5,  h: 12 },
    { left: 90, delay: 0.2,  dur: 0.48, h: 11 },
  ];
  return (
    <div className="relative w-14 h-14 overflow-hidden">
      {/* Very dark cloud */}
      <div className="absolute top-0 -left-0.5 w-13 h-6 bg-gray-700 rounded-full shadow-md">
        <div className="absolute -top-2 left-2 w-5 h-5 bg-gray-700 rounded-full" />
        <div className="absolute -top-1.5 left-5 w-4 h-4 bg-gray-700 rounded-full" />
      </div>
      {/* Lightning bolt */}
      <div
        className="absolute text-yellow-300 text-xs font-bold"
        style={{
          left: '42%',
          top: '30%',
          animation: 'lightning 2s 0.5s infinite',
          fontSize: 12,
        }}
      >
        ⚡
      </div>
      {drops.map((d, i) => (
        <div
          key={i}
          className="absolute w-0.5 rounded-full bg-blue-300"
          style={{
            left: `${d.left}%`,
            top: '46%',
            height: d.h,
            animation: `rain-fall ${d.dur}s ${d.delay}s infinite linear`,
          }}
        />
      ))}
    </div>
  );
}

// --- Main widget --------------------------------------------------------------
export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');

  useEffect(() => {
    let lat = -6.2088;  // Default: Jakarta
    let lon = 106.8456;

    const fetchWeather = async (la: number, lo: number, cityName: string) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,weather_code&timezone=auto`
        );
        const data = await res.json();
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
          city: cityName,
        });
      } catch {
        // silently fail — widget just won't show
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          // Reverse geocode city name with Open-Meteo nominatim (no key required)
          try {
            const geo = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            );
            const geoData = await geo.json();
            const cityName =
              geoData.address?.city ||
              geoData.address?.town ||
              geoData.address?.village ||
              geoData.address?.county ||
              'Lokasi Anda';
            setCity(cityName);
            fetchWeather(lat, lon, cityName);
          } catch {
            setCity('Lokasi Anda');
            fetchWeather(lat, lon, 'Lokasi Anda');
          }
        },
        () => {
          // Permission denied — use Jakarta default
          setCity('Jakarta');
          fetchWeather(lat, lon, 'Jakarta');
        },
        { timeout: 5000 }
      );
    } else {
      setCity('Jakarta');
      fetchWeather(lat, lon, 'Jakarta');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700" />
        <div className="space-y-1">
          <div className="w-16 h-3 bg-gray-200 dark:bg-zinc-700 rounded" />
          <div className="w-10 h-3 bg-gray-200 dark:bg-zinc-700 rounded" />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const type = getWeatherType(weather.code);
  const label = getWeatherLabel(weather.code);

  const bgMap: Record<WeatherType, string> = {
    sunny:   'bg-amber-50   dark:bg-amber-500/10  border-amber-200  dark:border-amber-500/20',
    cloudy:  'bg-gray-50    dark:bg-zinc-800      border-gray-200   dark:border-white/10',
    drizzle: 'bg-sky-50     dark:bg-sky-500/10    border-sky-200    dark:border-sky-500/20',
    rainy:   'bg-blue-50    dark:bg-blue-500/10   border-blue-200   dark:border-blue-500/20',
    stormy:  'bg-slate-100  dark:bg-slate-800     border-slate-300  dark:border-slate-600',
  };

  const tempColor: Record<WeatherType, string> = {
    sunny:   'text-amber-600  dark:text-amber-400',
    cloudy:  'text-gray-600   dark:text-gray-300',
    drizzle: 'text-sky-600    dark:text-sky-400',
    rainy:   'text-blue-600   dark:text-blue-400',
    stormy:  'text-slate-600  dark:text-slate-300',
  };

  return (
    <>
      {/* Inject keyframe animations once */}
      <style>{`
        @keyframes rain-fall {
          0%   { transform: translateY(0);    opacity: 1; }
          80%  { opacity: 0.8; }
          100% { transform: translateY(18px); opacity: 0; }
        }
        @keyframes lightning {
          0%, 90%, 100% { opacity: 0; }
          91%, 93%      { opacity: 1; }
          92%, 94%      { opacity: 0; }
          95%           { opacity: 1; }
        }
      `}</style>

      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors duration-300 ${bgMap[type]}`}
        title={`${label} – ${weather.temp}°C`}
      >
        {/* Animated scene */}
        {type === 'sunny'   && <SunScene />}
        {type === 'cloudy'  && <CloudScene />}
        {type === 'drizzle' && <DrizzleScene />}
        {type === 'rainy'   && <RainScene />}
        {type === 'stormy'  && <StormScene />}

        {/* Text info */}
        <div className="text-left leading-tight">
          <div className={`text-lg font-bold ${tempColor[type]}`}>
            {weather.temp}°C
          </div>
          <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{label}</div>
          <div className="text-xs text-gray-400 dark:text-zinc-500 truncate max-w-20">{city}</div>
        </div>
      </div>
    </>
  );
}
