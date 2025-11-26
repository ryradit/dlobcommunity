// Type definitions for badminton knowledge base
interface TechniqueInfo {
  name: string;
  descriptions: {
    id: string;
    en: string;
  };
  tips: string[];
}

interface EquipmentInfo {
  tips: string[];
}

interface ShuttlecockInfo {
  types: string[];
}

interface RulesInfo {
  scoring: {
    id: string;
    en: string;
  };
  service: {
    id: string;
    en: string;
  };
  faults: string[];
}

interface BadmintonKnowledgeBase {
  techniques: {
    basic: TechniqueInfo[];
    intermediate: TechniqueInfo[];
    advanced: TechniqueInfo[];
  };
  rules: RulesInfo;
  strategies: {
    singles: string[];
    doubles: string[];
  };
  training: {
    warmup: string[];
    drills: string[];
    recovery: string[];
  };
  equipment: {
    racket: EquipmentInfo;
    shuttlecock: ShuttlecockInfo;
    shoes: EquipmentInfo;
  };
  matchEtiquette: string[];
}

// Badminton Knowledge Base for DLOB AI
export const badmintonKnowledgeBase: BadmintonKnowledgeBase = {
  techniques: {
    basic: [
      {
        name: "Grip",
        descriptions: {
          id: "Cara memegang raket yang benar adalah kunci dasar dalam bermain badminton. Grip yang tepat memungkinkan Anda mengontrol raket dengan lebih baik dan menghasilkan pukulan yang lebih akurat.",
          en: "The correct way to hold your racket is fundamental in badminton. A proper grip allows better racket control and more accurate shots."
        },
        tips: [
          "Forehand grip untuk pukulan depan",
          "Backhand grip untuk pukulan backhand",
          "Hindari menggenggam terlalu kuat"
        ]
      },
      {
        name: "Footwork",
        descriptions: {
          id: "Gerakan kaki yang baik memungkinkan Anda mencapai kok dengan lebih efisien dan memposisikan diri dengan lebih baik untuk pukulan berikutnya.",
          en: "Good footwork allows you to reach the shuttlecock more efficiently and position yourself better for the next shot."
        },
        tips: [
          "Selalu kembali ke posisi tengah",
          "Langkah kecil dan cepat",
          "Jaga keseimbangan"
        ]
      }
    ],
    intermediate: [
      {
        name: "Smash",
        descriptions: {
          id: "Pukulan smash adalah senjata utama untuk mencetak poin. Kombinasi kekuatan dan akurasi membuat smash efektif.",
          en: "The smash is a primary weapon for scoring points. It combines power and accuracy for effectiveness."
        },
        tips: [
          "Timing adalah kunci",
          "Gunakan pergelangan tangan",
          "Arahkan ke tempat kosong"
        ]
      },
      {
        name: "Drop Shot",
        descriptions: {
          id: "Drop shot adalah pukulan halus yang menjatuhkan kok tepat di belakang net. Sangat efektif untuk mengubah ritme permainan.",
          en: "The drop shot is a gentle shot that lands the shuttle just over the net. Very effective for changing game rhythm."
        },
        tips: [
          "Gerakan sama seperti smash",
          "Kurangi power di akhir",
          "Variasikan arah dan kecepatan"
        ]
      }
    ],
    advanced: [
      {
        name: "Deception",
        descriptions: {
          id: "Teknik mengelabui lawan dengan menyembunyikan arah pukulan sampai detik terakhir.",
          en: "Techniques to deceive opponents by hiding shot direction until the last moment."
        },
        tips: [
          "Gunakan gerakan badan",
          "Variasikan ritme pukulan",
          "Sembunyikan arah sampai akhir"
        ]
      }
    ]
  },
  rules: {
    scoring: {
      id: "Sistem skor rally point sampai 21, dengan keunggulan minimal 2 poin. Jika 20-20, permainan dilanjutkan sampai selisih 2 poin atau maksimal 30.",
      en: "Rally point scoring system up to 21, with a minimum 2-point lead. If tied at 20-20, play continues until 2-point difference or max 30."
    },
    service: {
      id: "Servis harus dilakukan secara diagonal, dengan kok dipukul di bawah pinggang. Untuk ganda, area servis berbeda saat skor genap dan ganjil.",
      en: "Service must be diagonal, with shuttle hit below waist height. For doubles, service area changes between even and odd scores."
    },
    faults: [
      "Kok menyentuh lantai di luar garis",
      "Kok menyentuh tubuh atau pakaian pemain",
      "Kok terkena raket dua kali di sisi sendiri",
      "Menyentuh net saat bermain",
      "Servis tidak diagonal"
    ]
  },
  strategies: {
    singles: [
      "Manfaatkan seluruh lapangan",
      "Variasikan pukulan panjang dan pendek",
      "Buat lawan bergerak sebanyak mungkin",
      "Jaga posisi tengah lapangan"
    ],
    doubles: [
      "Komunikasi dengan partner",
      "Rotasi front-back dan side-by-side",
      "Cover partner saat mereka menyerang",
      "Serang ke celah antara dua pemain"
    ]
  },
  training: {
    warmup: [
      "Pemanasan seluruh tubuh minimal 10 menit",
      "Fokus pada pergelangan tangan dan kaki",
      "Shadow badminton untuk aktivasi"
    ],
    drills: [
      "Clear shot konsisten",
      "Multi-shuttle untuk smash",
      "Latihan footwork dengan cone",
      "Rally kontrol tanpa smash"
    ],
    recovery: [
      "Pendinginan dan stretching",
      "Hidrasi yang cukup",
      "Istirahat minimal 24 jam antar latihan intensif"
    ]
  },
  equipment: {
    racket: {
      tips: [
        "Pilih raket sesuai level bermain",
        "Perhatikan berat dan balance point",
        "Ganti grip secara berkala",
        "Jaga tension senar sesuai kebutuhan"
      ]
    },
    shuttlecock: {
      types: [
        "Plastik untuk pemula dan latihan",
        "Bulu untuk pertandingan dan pemain advance"
      ]
    },
    shoes: {
      tips: [
        "Gunakan sepatu khusus badminton",
        "Pastikan grip sol yang baik",
        "Ganti jika sol sudah aus"
      ]
    }
  },
  matchEtiquette: [
    "Beri salam sebelum dan sesudah bermain",
    "Akui kesalahan sendiri",
    "Hormati keputusan wasit",
    "Jaga sportivitas"
  ]
};