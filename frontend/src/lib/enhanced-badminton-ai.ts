import { GoogleGenerativeAI } from '@google/generative-ai';
import { badmintonKnowledgeBase } from './badminton-knowledge';

export class EnhancedBadmintonAI {
  private static instance: EnhancedBadmintonAI;
  private apiKey: string;
  
  private constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  }

  static getInstance(): EnhancedBadmintonAI {
    if (!EnhancedBadmintonAI.instance) {
      EnhancedBadmintonAI.instance = new EnhancedBadmintonAI();
    }
    return EnhancedBadmintonAI.instance;
  }

  private getTechniqueTips(technique: string): string {
    const allTechniques = [
      ...badmintonKnowledgeBase.techniques.basic,
      ...badmintonKnowledgeBase.techniques.intermediate,
      ...badmintonKnowledgeBase.techniques.advanced
    ];

    const found = allTechniques.find(t => 
      t.name.toLowerCase() === technique.toLowerCase()
    );

    if (found) {
      return `
Teknik: ${found.name}
${found.descriptions.id}

Tips:
${found.tips.map(tip => `- ${tip}`).join('\n')}
      `;
    }

    return 'Maaf, saya tidak memiliki informasi spesifik tentang teknik tersebut.';
  }

  private getStrategyTips(type: 'singles' | 'doubles'): string {
    const strategies = badmintonKnowledgeBase.strategies[type];
    return `
Tips Strategi ${type === 'singles' ? 'Tunggal' : 'Ganda'}:
${strategies.map(strategy => `- ${strategy}`).join('\n')}
    `;
  }

  private getTrainingTips(): string {
    const { warmup, drills, recovery } = badmintonKnowledgeBase.training;
    return `
Panduan Latihan Lengkap:

Pemanasan:
${warmup.map(w => `- ${w}`).join('\n')}

Latihan Inti:
${drills.map(d => `- ${d}`).join('\n')}

Pemulihan:
${recovery.map(r => `- ${r}`).join('\n')}
    `;
  }

  private getEquipmentAdvice(type: 'racket' | 'shuttlecock' | 'shoes'): string {
    const equipment = badmintonKnowledgeBase.equipment[type];
    if ('types' in equipment) {
      return `
Tips Memilih Shuttlecock:
${equipment.types.map(t => `- ${t}`).join('\n')}
      `;
    }
    if ('tips' in equipment) {
      return `
Tips ${type === 'racket' ? 'Raket' : 'Sepatu'}:
${equipment.tips.map(t => `- ${t}`).join('\n')}
      `;
    }
    return '';
  }

  private getRulesExplanation(): string {
    const { scoring, service, faults } = badmintonKnowledgeBase.rules;
    return `
Peraturan Badminton:

Sistem Skor:
${scoring.id}

Servis:
${service.id}

Kesalahan Umum:
${faults.map(fault => `- ${fault}`).join('\n')}
    `;
  }

  enhanceResponse(question: string, baseResponse: string): string {
    const lowerQuestion = question.toLowerCase();
    let enhancedInfo = '';

    // Check for specific topics in the question
    if (lowerQuestion.includes('teknik') || lowerQuestion.includes('cara')) {
      ['grip', 'footwork', 'smash', 'dropshot', 'deception'].forEach(technique => {
        if (lowerQuestion.includes(technique)) {
          enhancedInfo += this.getTechniqueTips(technique);
        }
      });
    }

    if (lowerQuestion.includes('strategi') || lowerQuestion.includes('taktik')) {
      if (lowerQuestion.includes('ganda')) {
        enhancedInfo += this.getStrategyTips('doubles');
      } else if (lowerQuestion.includes('tunggal')) {
        enhancedInfo += this.getStrategyTips('singles');
      }
    }

    if (lowerQuestion.includes('latihan') || lowerQuestion.includes('training')) {
      enhancedInfo += this.getTrainingTips();
    }

    if (lowerQuestion.includes('raket')) {
      enhancedInfo += this.getEquipmentAdvice('racket');
    }

    if (lowerQuestion.includes('sepatu') || lowerQuestion.includes('shoes')) {
      enhancedInfo += this.getEquipmentAdvice('shoes');
    }

    if (lowerQuestion.includes('kok') || lowerQuestion.includes('shuttlecock')) {
      enhancedInfo += this.getEquipmentAdvice('shuttlecock');
    }

    if (lowerQuestion.includes('peraturan') || lowerQuestion.includes('rules')) {
      enhancedInfo += this.getRulesExplanation();
    }

    if (enhancedInfo) {
      return `${baseResponse}\n\nInformasi tambahan:\n${enhancedInfo}\n\nAda yang lain bisa saya bantu? 🏸`;
    }

    return baseResponse;
  }
}