export interface JerseyImageDetail {
  url: string;
  pov: 'depan' | 'belakang' | 'samping' | 'atas' | 'bahan' | 'promosi';
  label: string;
  description?: string;
}

export interface JerseyColorVariant {
  id: string;
  name: string;
  color: string; // Hex or CSS color
  images: string[];
  imageDetails?: JerseyImageDetail[];
  videoUrl?: string;
  backImage?: string;
  nameColor?: string;
  nameStroke?: string;
  bgColor?: string;
}

export interface JerseyBatch {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: 'open' | 'closed' | 'coming-soon';
  rekapStatus: 'open' | 'closed';
  badge: string;
  badgeType: 'active-preorder' | 'closed' | 'coming-soon';
  startingPrice: number;
  material: string;
  care: string;
  origin: string;
  estimatedDelivery: string;
  colorVariants: JerseyColorVariant[];
  introductionVideos?: string[];
  closedMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Default Seed Batches ──────────────────────────────────────────
export const DEFAULT_JERSEY_BATCHES: JerseyBatch[] = [
  {
    id: 'official',
    slug: 'official',
    name: 'Jersey DLOB Official',
    tagline: 'Edisi Resmi Komunitas · Dewasa, Kids & Balita Edition',
    description: "Jersey resmi official DLOB dengan material Milano Standard Premium! Hadir dalam 4 pilihan warna — Biru Navy, Kuning, Merah, dan Pink. Tersedia dalam ukuran Dewasa (Rp 110k), Kids (Rp 100k), dan Balita 👶 (Rp 100k). Menggunakan teknologi kain ringan, adem, cepat kering, dan menyerap keringat optimal.",
    status: 'open',
    rekapStatus: 'open',
    badge: 'PRE-ORDER AKTIF',
    badgeType: 'active-preorder',
    startingPrice: 100000,
    material: 'Milano Standard Premium',
    care: 'Cuci dengan air dingin, jangan gunakan pemutih',
    origin: 'Indonesia',
    estimatedDelivery: 'Kuota 15 Order',
    colorVariants: [
      {
        id: 'off-blue',
        name: 'Biru Navy',
        color: '#0b244c',
        images: [
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_86vjkm86vjkm86vj.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_bshhejbshhejbshh.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_n9wn5fn9wn5fn9wn.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_9xg9z19xg9z19xg9.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_muamj2muamj2muam.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/biru-photo1.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/biru-photo2.jpeg',
        ],
        imageDetails: [
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_86vjkm86vjkm86vj.jpeg',
            pov: 'depan',
            label: 'Tampak Depan · Court Lifestyle',
            description: 'Sudut depan penuh di lapangan badminton memperlihatkan potongan athletic fit dan warna navy khas DLOB.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_bshhejbshhejbshh.jpeg',
            pov: 'depan',
            label: 'Tampak Depan · Casual Streetwear',
            description: 'Look kasual harian modern dengan sunglasses dan celana denim, fleksibel untuk nongkrong maupun olahraga.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_n9wn5fn9wn5fn9wn.jpeg',
            pov: 'belakang',
            label: 'Tampak Belakang · Custom Name & Logo',
            description: 'Tampilan punggung dengan sablon custom nama pemain dan logo d\'lob di bagian bawah.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_9xg9z19xg9z19xg9.jpeg',
            pov: 'atas',
            label: 'Tampak Atas · High Angle POV',
            description: 'Sudut pandang atas (high-angle) memperlihatkan siluet bahu dan potongan jersey saat beraktivitas di lapangan.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_muamj2muamj2muam.jpeg',
            pov: 'bahan',
            label: 'Tampak Bahan · Detail Milano & Kerah',
            description: 'Foto makro tekstur rajutan Milano Standard Premium, jahitan kerah V-neck rapi, dan sablon logo presisi.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/biru-photo1.jpeg',
            pov: 'promosi',
            label: 'Mockup Promosi 1',
            description: 'Visual promosi grafis jersey DLOB Biru Navy.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/biru-photo2.jpeg',
            pov: 'promosi',
            label: 'Mockup Promosi 2',
            description: 'Visual katalog promosi jersey DLOB Biru Navy.',
          },
        ],
        backImage: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/jersey%20dlob%20back%20biru.png',
        videoUrl: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/biru-video1.mp4',
        nameColor: '#bf8f09',
        nameStroke: '1px #000000',
        bgColor: '#0b244c',
      },
      {
        id: 'off-yellow',
        name: 'Kuning',
        color: '#FFC000',
        images: [
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_mwb1emmwb1emmwb1.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_sndvzosndvzosndv.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_7tgamq7tgamq7tga.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_hypb1zhypb1zhypb.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/kuning-photo1.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/kuning-photo2.jpeg',
        ],
        imageDetails: [
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_mwb1emmwb1emmwb1.jpeg',
            pov: 'depan',
            label: 'Tampak Depan · Cafe Streetwear',
            description: 'Tampilan depan energik dengan warna kuning cerah dipadukan celana jeans kasual gaya Gen-Z.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_sndvzosndvzosndv.jpeg',
            pov: 'belakang',
            label: 'Tampak Belakang · Player Name & Channel',
            description: 'Tampak belakang jelas memperlihatkan font nama atlet dan logo d\'lob channel pada punggung.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_7tgamq7tgamq7tga.jpeg',
            pov: 'atas',
            label: 'Tampak Atas · High Angle POV',
            description: 'Sudut pandang POV atas dari meja cafe menonjolkan kombinasi warna kuning dan motif daun gelap.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_hypb1zhypb1zhypb.jpeg',
            pov: 'bahan',
            label: 'Tampak Bahan · Detail Tekstur Milano',
            description: 'Serat kain berpori mikro Milano yang cepat menyerap keringat dan adem digunakan saat berolahraga.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/kuning-photo1.jpeg',
            pov: 'promosi',
            label: 'Mockup Promosi 1',
            description: 'Visual promosi grafis jersey DLOB Kuning.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/kuning-photo2.jpeg',
            pov: 'promosi',
            label: 'Mockup Promosi 2',
            description: 'Visual katalog promosi jersey DLOB Kuning.',
          },
        ],
        backImage: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/jersey%20dlob%20back%20kuning.png',
        videoUrl: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/kuning-video1.mp4',
        nameColor: '#1a1a1a',
        nameStroke: 'none',
        bgColor: '#b8860b',
      },
      {
        id: 'off-red',
        name: 'Merah',
        color: '#ff0000',
        images: [
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_1jtv3h1jtv3h1jtv.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_6ha3n16ha3n16ha3.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_ex0q1zex0q1zex0q.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_htribzhtribzhtri.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_qyf91jqyf91jqyf9.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/merah-photo1.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/merah-photo2.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/merah-photo3.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/merah-photo4.jpeg',
        ],
        imageDetails: [
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_1jtv3h1jtv3h1jtv.jpeg',
            pov: 'depan',
            label: 'Tampak Depan · Outdoor Urban',
            description: 'Pose depan full body menampilkan karakter warna merah bold berpadu stripe putih dan motif DLOB.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_6ha3n16ha3n16ha3.jpeg',
            pov: 'depan',
            label: 'Tampak Depan · Editorial Pose',
            description: 'Sudut santai di railing tangga menonjolkan drape kain yang jatuh rapi dan fit modern.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_ex0q1zex0q1zex0q.jpeg',
            pov: 'samping',
            label: 'Tampak Samping · Profile Fit',
            description: 'Tampak samping memperlihatkan fitting lengan, kerah samping, dan proporsi potongan tubuh atletis.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_htribzhtribzhtri.jpeg',
            pov: 'belakang',
            label: 'Tampak Belakang · Custom Name',
            description: 'Tampak punggung dengan layout nama custom dan aksen strip putih kontras.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/Gemini_Generated_Image_qyf91jqyf91jqyf9.jpeg',
            pov: 'bahan',
            label: 'Tampak Bahan · Detail Milano & Sablon',
            description: 'Makro tekstur kain Milano dengan sablon logo d\'lob tajam dan aksen strip merah premium.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/merah-photo1.jpeg',
            pov: 'promosi',
            label: 'Mockup Promosi 1',
            description: 'Visual promosi grafis jersey DLOB Merah.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/merah-photo2.jpeg',
            pov: 'promosi',
            label: 'Mockup Promosi 2',
            description: 'Visual katalog promosi jersey DLOB Merah.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/merah-photo3.jpeg',
            pov: 'promosi',
            label: 'Mockup Promosi 3',
            description: 'Visual katalog promosi jersey DLOB Merah.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/merah-photo4.jpeg',
            pov: 'promosi',
            label: 'Mockup Promosi 4',
            description: 'Visual katalog promosi jersey DLOB Merah.',
          },
        ],
        backImage: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/jersey%20dlob%20back%20merah.png',
        videoUrl: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/official/merah-video2.mp4',
        nameColor: '#FFFFFF',
        nameStroke: 'none',
        bgColor: '#8b0000',
      },
      {
        id: 'off-pink',
        name: 'Pink',
        color: '#c8a19c',
        images: [
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/pink8.png',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/pink6.png',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/pink7.png',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/pink9.png',
        ],
        imageDetails: [
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/pink8.png',
            pov: 'depan',
            label: 'Tampak Depan · Model Pose',
            description: 'Model mengenakan jersey official DLOB edisi Pink pastel yang anggun dan sporty.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/pink6.png',
            pov: 'depan',
            label: 'Tampak Depan · Natural Fit',
            description: 'Tampak depan potret model memperlihatkan fitting pas di badan.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/pink7.png',
            pov: 'samping',
            label: 'Tampak Samping · Sporty Chic',
            description: 'Siluet samping menunjukkan aksen warna pink lembut yang menyatu dengan motif dinamis.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/pink9.png',
            pov: 'depan',
            label: 'Tampak Depan · Full Look',
            description: 'Full body view edisi Pink untuk inspirasi gaya padu padan outfit.',
          },
        ],
        bgColor: '#c8a19c',
      },
    ],
    introductionVideos: [
      'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/new-batch/biru-video1.mp4',
      'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/new-batch/biru-video2.mp4',
      'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/new-batch/kuning-video1.mp4',
      'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/new-batch/merah-video1.mp4',
      'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/new-batch/merah-video2.mp4',
      'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videomodel1.mp4',
      'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videomodel3.mp4',
      'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videomodel5.mp4',
    ],
    closedMessage: 'Pemesanan Pre-Order Jersey DLOB Official saat ini telah resmi ditutup. Nantikan informasi pembukaan batch berikutnya!',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'noir-concept',
    slug: 'noir',
    name: 'DLOB Jersey – Noir',
    tagline: 'The Dark Circuit Edition',
    description: 'Desain masa depan jersey kompetisi DLOB. Mengusung konsep stealth hitam-monokrom dengan aksen tipografi futuristik.',
    status: 'coming-soon',
    rekapStatus: 'closed',
    badge: 'SEGERA HADIR',
    badgeType: 'coming-soon',
    startingPrice: 120000,
    material: 'Milano Ultra-Vent (Development Phase)',
    care: 'Cuci dengan air dingin',
    origin: 'Indonesia',
    estimatedDelivery: 'Segera Diumumkan',
    colorVariants: [
      {
        id: 'midnight',
        name: 'Midnight Black',
        color: '#0d0d0d',
        images: [
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/hitam1.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/hitam2.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/hitam3.jpeg',
        ],
        imageDetails: [
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/hitam1.jpeg',
            pov: 'depan',
            label: 'Tampak Depan · Stealth Black',
            description: 'Konsep stealth hitam monokrom dengan aksen tipografi futuristik.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/hitam2.jpeg',
            pov: 'samping',
            label: 'Tampak Samping · Profile Fit',
            description: 'Siluet samping presisi dengan potongan sporty aerodinamis.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/hitam3.jpeg',
            pov: 'belakang',
            label: 'Tampak Belakang · Circuit Line',
            description: 'Layout belakang beraksen sirkuit modern edisi Noir.',
          },
        ],
        bgColor: '#0d0d0d',
      },
      {
        id: 'charcoal',
        name: 'Charcoal Grey',
        color: '#3a3a3a',
        images: [
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/grey1.png',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/grey2.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/grey3.png',
        ],
        imageDetails: [
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/grey1.png',
            pov: 'depan',
            label: 'Tampak Depan · Urban Monochrome',
            description: 'Nuansa abu-abu gelap berpadu grafis tipografi futuristik.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/grey2.jpeg',
            pov: 'samping',
            label: 'Tampak Samping · Athletic Cut',
            description: 'Fitting samping ergonomis untuk mobilitas kompetisi.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/grey3.png',
            pov: 'belakang',
            label: 'Tampak Belakang · Minimalist Back',
            description: 'Tampak belakang elegan dengan visual sirkuit minimalis.',
          },
        ],
        bgColor: '#3a3a3a',
      },
      {
        id: 'steelblue',
        name: 'Steel Blue Night',
        color: '#1e2d40',
        images: [
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/bluenight1.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/bluenight2.jpeg',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/bluenight3.jpeg',
        ],
        imageDetails: [
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/bluenight1.jpeg',
            pov: 'depan',
            label: 'Tampak Depan · Indigo Midnight',
            description: 'Perpaduan warna biru malam pekat dengan garis dinamis.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/bluenight2.jpeg',
            pov: 'samping',
            label: 'Tampak Samping · Dynamic Side',
            description: 'Aksen garis samping menambah kesan ramping dan tangguh.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/bluenight3.jpeg',
            pov: 'belakang',
            label: 'Tampak Belakang · Dark Night',
            description: 'Tampak belakang bernuansa deep blue dengan branding eksklusif.',
          },
        ],
        bgColor: '#1e2d40',
      },
      {
        id: 'blossomrose',
        name: 'Blossom Rose',
        color: '#c8a19c',
        images: [
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/magentaspecial.png',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/magentaspecial2.png',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/magentaspecial3.png',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/magentaspecial4.png',
          'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/magentaspecial5.png',
        ],
        imageDetails: [
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/magentaspecial.png',
            pov: 'depan',
            label: 'Tampak Depan · Cyber Blossom',
            description: 'Aksen rose pastel futuristik yang berani dan energik.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/magentaspecial2.png',
            pov: 'samping',
            label: 'Tampak Samping · Street Silhouette',
            description: 'Potongan siluet samping street-style premium.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/magentaspecial3.png',
            pov: 'belakang',
            label: 'Tampak Belakang · Rose Edition',
            description: 'Tampilan belakang kontras dengan grafis khas Noir Blossom.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/magentaspecial4.png',
            pov: 'depan',
            label: 'Tampak Depan · Editorial Pose',
            description: 'Sudut model kasual menonjolkan drape kain yang jatuh alami.',
          },
          {
            url: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/members/model/magentaspecial5.png',
            pov: 'depan',
            label: 'Tampak Depan · Full View',
            description: 'Tampilan penuh busana keseluruhan edisi Blossom Rose.',
          },
        ],
        videoUrl: 'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/store-videos/videopromotionnoirblossom.mp4',
        bgColor: '#c8a19c',
      },
    ],
    closedMessage: 'Jersey edisi Noir saat ini sedang dalam tahap finalisasi desain pabrik.',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];
