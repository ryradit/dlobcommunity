import HeroSection from '@/components/HeroSection';
import GallerySection from '@/components/GallerySection';
import FeaturesSection from '@/components/FeaturesSection';
import { CommunityCTA } from '@/components/ui/community-cta';
import ArtikelSection from '@/components/ArtikelSection';
import SurveyCTA from '@/components/SurveyCTA';
import StatsSection from '@/components/StatsSection';
import HubungiKamiSection from '@/components/HubungiKamiSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section - About Apps */}
      <FeaturesSection />

      {/* Gallery Section */}
      <GallerySection />

      {/* Artikel Section */}
      <ArtikelSection />

      {/* Survey CTA Banner */}
      <SurveyCTA />

      {/* Stats Section */}
      <StatsSection />

      {/* Hubungi Kami Section */}
      <HubungiKamiSection />

      {/* CTA Section - Mulai Bergabung */}
      <CommunityCTA />
    </main>
  );
}
