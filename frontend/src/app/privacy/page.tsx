'use client';

import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { useLanguage } from '@/hooks/useLanguage';

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: October 26, 2025",
      sections: {
        introduction: {
          title: "1. Introduction",
          content: "DLOB (\"we,\" \"our,\" or \"us\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our badminton community platform."
        },
        collection: {
          title: "2. Information We Collect",
          content: "We collect information you provide directly to us, such as when you create an account, update your profile, participate in community activities, or contact us. This may include your name, email address, phone number, and badminton-related preferences."
        },
        usage: {
          title: "3. How We Use Your Information",
          content: "We use the information we collect to: (a) provide, maintain, and improve our services; (b) process attendance and match participation; (c) manage payment tracking and community fees; (d) communicate with you about services, updates, and community events; (e) provide AI-powered analytics and recommendations."
        },
        sharing: {
          title: "4. Information Sharing",
          content: "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with community administrators for legitimate community management purposes."
        },
        security: {
          title: "5. Data Security",
          content: "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure."
        },
        retention: {
          title: "6. Data Retention",
          content: "We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law."
        },
        rights: {
          title: "7. Your Privacy Rights",
          content: "You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us. To exercise these rights, please contact us using the information provided below."
        },
        cookies: {
          title: "8. Cookies and Tracking",
          content: "We use cookies and similar tracking technologies to enhance your experience on our platform. You can control cookie settings through your browser preferences."
        },
        children: {
          title: "9. Children's Privacy",
          content: "Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us."
        },
        changes: {
          title: "10. Changes to This Policy",
          content: "We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the \"Last Updated\" date."
        },
        contact: {
          title: "11. Contact Us",
          content: "If you have any questions about this Privacy Policy, please contact us at admin@dlob.community or +62 812-7073-7272."
        }
      }
    },
    id: {
      title: "Kebijakan Privasi",
      lastUpdated: "Terakhir Diperbarui: 26 Oktober 2025",
      sections: {
        introduction: {
          title: "1. Pendahuluan",
          content: "DLOB (\"kami,\" \"milik kami,\" atau \"kita\") berkomitmen untuk melindungi privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi Anda ketika Anda menggunakan platform komunitas bulu tangkis kami."
        },
        collection: {
          title: "2. Informasi yang Kami Kumpulkan",
          content: "Kami mengumpulkan informasi yang Anda berikan langsung kepada kami, seperti ketika Anda membuat akun, memperbarui profil, berpartisipasi dalam kegiatan komunitas, atau menghubungi kami. Ini mungkin termasuk nama, alamat email, nomor telepon, dan preferensi terkait bulu tangkis Anda."
        },
        usage: {
          title: "3. Bagaimana Kami Menggunakan Informasi Anda",
          content: "Kami menggunakan informasi yang kami kumpulkan untuk: (a) menyediakan, memelihara, dan meningkatkan layanan kami; (b) memproses kehadiran dan partisipasi pertandingan; (c) mengelola pelacakan pembayaran dan biaya komunitas; (d) berkomunikasi dengan Anda tentang layanan, pembaruan, dan acara komunitas; (e) menyediakan analitik dan rekomendasi bertenaga AI."
        },
        sharing: {
          title: "4. Berbagi Informasi",
          content: "Kami tidak menjual, memperdagangkan, atau mentransfer informasi pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali seperti yang dijelaskan dalam kebijakan ini. Kami dapat berbagi informasi dengan administrator komunitas untuk tujuan manajemen komunitas yang sah."
        },
        security: {
          title: "5. Keamanan Data",
          content: "Kami menerapkan langkah-langkah keamanan yang tepat untuk melindungi informasi pribadi Anda dari akses, perubahan, pengungkapan, atau penghancuran yang tidak sah. Namun, tidak ada metode transmisi melalui Internet atau penyimpanan elektronik yang 100% aman."
        },
        retention: {
          title: "6. Penyimpanan Data",
          content: "Kami menyimpan informasi pribadi Anda hanya selama diperlukan untuk memenuhi tujuan yang diuraikan dalam Kebijakan Privasi ini, kecuali periode penyimpanan yang lebih lama diperlukan atau diizinkan oleh hukum."
        },
        rights: {
          title: "7. Hak Privasi Anda",
          content: "Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda. Anda juga dapat memilih untuk tidak menerima komunikasi tertentu dari kami. Untuk menggunakan hak-hak ini, silakan hubungi kami menggunakan informasi yang diberikan di bawah."
        },
        cookies: {
          title: "8. Cookie dan Pelacakan",
          content: "Kami menggunakan cookie dan teknologi pelacakan serupa untuk meningkatkan pengalaman Anda di platform kami. Anda dapat mengontrol pengaturan cookie melalui preferensi browser Anda."
        },
        children: {
          title: "9. Privasi Anak",
          content: "Layanan kami tidak ditujukan untuk anak-anak di bawah usia 13 tahun. Kami tidak secara sadar mengumpulkan informasi pribadi dari anak-anak di bawah 13 tahun. Jika Anda mengetahui bahwa seorang anak telah memberikan informasi pribadi kepada kami, silakan hubungi kami."
        },
        changes: {
          title: "10. Perubahan pada Kebijakan Ini",
          content: "Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberi tahu Anda tentang perubahan material dengan memposting Kebijakan Privasi baru di halaman ini dan memperbarui tanggal \"Terakhir Diperbarui\"."
        },
        contact: {
          title: "11. Hubungi Kami",
          content: "Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di admin@dlob.community atau +62 812-7073-7272."
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