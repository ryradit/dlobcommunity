'use client';

import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { useLanguage } from '@/hooks/useLanguage';

export default function TermsOfServicePage() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last Updated: October 26, 2025",
      sections: {
        acceptance: {
          title: "1. Acceptance of Terms",
          content: "By accessing and using the DLOB platform, you accept and agree to be bound by the terms and provision of this agreement."
        },
        description: {
          title: "2. Service Description",
          content: "DLOB is a badminton community platform that provides attendance tracking, match scheduling, payment management, and AI-powered analytics for badminton communities."
        },
        registration: {
          title: "3. User Registration",
          content: "To access certain features of our service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete."
        },
        conduct: {
          title: "4. User Conduct",
          content: "You agree not to use the service to: (a) upload, post, or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable; (b) impersonate any person or entity or falsely state or otherwise misrepresent yourself; (c) upload, post, or transmit any content that you do not have a right to transmit under any law or under contractual or fiduciary relationships."
        },
        privacy: {
          title: "5. Privacy Policy",
          content: "Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices."
        },
        payments: {
          title: "6. Payments and Fees",
          content: "Community fees and payment schedules are determined by community administrators. DLOB provides payment tracking and management tools but is not responsible for individual payment disputes."
        },
        termination: {
          title: "7. Termination",
          content: "We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation."
        },
        disclaimer: {
          title: "8. Disclaimer",
          content: "The information on this platform is provided on an 'as is' basis. To the fullest extent permitted by law, DLOB excludes all representations, warranties, conditions and terms whether express or implied."
        },
        changes: {
          title: "9. Changes to Terms",
          content: "We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect."
        },
        contact: {
          title: "10. Contact Information",
          content: "If you have any questions about these Terms of Service, please contact us at admin@dlob.community or +62 812-7073-7272."
        }
      }
    },
    id: {
      title: "Syarat dan Ketentuan",
      lastUpdated: "Terakhir Diperbarui: 26 Oktober 2025",
      sections: {
        acceptance: {
          title: "1. Penerimaan Syarat",
          content: "Dengan mengakses dan menggunakan platform DLOB, Anda menerima dan setuju untuk terikat dengan syarat dan ketentuan perjanjian ini."
        },
        description: {
          title: "2. Deskripsi Layanan",
          content: "DLOB adalah platform komunitas bulu tangkis yang menyediakan pelacakan kehadiran, penjadwalan pertandingan, manajemen pembayaran, dan analitik bertenaga AI untuk komunitas bulu tangkis."
        },
        registration: {
          title: "3. Pendaftaran Pengguna",
          content: "Untuk mengakses fitur tertentu dari layanan kami, Anda harus mendaftar untuk sebuah akun. Anda setuju untuk memberikan informasi yang akurat, terkini, dan lengkap selama proses pendaftaran dan memperbarui informasi tersebut agar tetap akurat, terkini, dan lengkap."
        },
        conduct: {
          title: "4. Perilaku Pengguna",
          content: "Anda setuju untuk tidak menggunakan layanan untuk: (a) mengunggah, memposting, atau mengirimkan konten yang melanggar hukum, berbahaya, mengancam, kasar, melecehkan, memfitnah, vulgar, cabul, atau tidak pantas lainnya; (b) menyamar sebagai orang atau entitas lain atau salah menyatakan atau salah merepresentasikan diri Anda; (c) mengunggah, memposting, atau mengirimkan konten yang tidak Anda miliki hak untuk kirim berdasarkan hukum atau hubungan kontraktual atau fidusia."
        },
        privacy: {
          title: "5. Kebijakan Privasi",
          content: "Privasi Anda penting bagi kami. Silakan tinjau Kebijakan Privasi kami, yang juga mengatur penggunaan Layanan Anda, untuk memahami praktik kami."
        },
        payments: {
          title: "6. Pembayaran dan Biaya",
          content: "Biaya komunitas dan jadwal pembayaran ditentukan oleh administrator komunitas. DLOB menyediakan alat pelacakan dan manajemen pembayaran tetapi tidak bertanggung jawab atas sengketa pembayaran individual."
        },
        termination: {
          title: "7. Penghentian",
          content: "Kami dapat menghentikan atau menangguhkan akun Anda dan memblokir akses ke layanan segera, tanpa pemberitahuan atau kewajiban sebelumnya, dengan kebijakan kami sendiri, untuk alasan apapun dan tanpa batasan."
        },
        disclaimer: {
          title: "8. Penafian",
          content: "Informasi di platform ini disediakan 'sebagaimana adanya'. Sejauh yang diizinkan oleh hukum, DLOB mengeluarkan semua representasi, jaminan, kondisi dan syarat baik tersurat maupun tersirat."
        },
        changes: {
          title: "9. Perubahan Syarat",
          content: "Kami berhak untuk mengubah atau mengganti Syarat ini kapan saja. Jika revisi bersifat material, kami akan memberikan pemberitahuan setidaknya 30 hari sebelum syarat baru berlaku."
        },
        contact: {
          title: "10. Informasi Kontak",
          content: "Jika Anda memiliki pertanyaan tentang Syarat Layanan ini, silakan hubungi kami di admin@dlob.community atau +62 812-7073-7272."
        }
      }
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="contact" showAuth={true} />
      
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/dlob.png"
              alt="DLOB"
              width={64}
              height={64}
              className="rounded-full object-cover"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-gray-600">{t.lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="prose prose-blue max-w-none">
            {Object.entries(t.sections).map(([key, section]) => (
              <div key={key} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                <p className="text-gray-700 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {language === 'en' ? 'Back to Home' : 'Kembali ke Beranda'}
          </Link>
        </div>
      </div>
    </div>
  );
}