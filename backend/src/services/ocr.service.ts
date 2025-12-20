// Mock OCR Service - simplified for development
// In production, you would use actual Gemini Vision API and Supabase

const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface MatchNote {
  players: string[];
  shuttlecockCount: number;
  score: {
    team1: number;
    team2: number;
  };
  date: string;
}

export class OCRService {
  async processMatchNote(imageUrl: string): Promise<MatchNote | null> {
    try {
      console.log('Processing match note image:', imageUrl);
      
      // Mock processing delay
      await mockDelay(1500);

      // Mock extracted data - in production this would use Gemini Vision API
      const mockMatchData: MatchNote = {
        players: ["Ahmad", "Budi", "Charlie", "David"],
        shuttlecockCount: 2,
        score: {
          team1: 21,
          team2: 18
        },
        date: new Date().toISOString().split('T')[0] || new Date().toLocaleDateString()
      };

      console.log('Mock OCR processing completed:', mockMatchData);

      // Validate the extracted data
      if (!this.validateMatchData(mockMatchData)) {
        throw new Error('Invalid match data format');
      }

      return mockMatchData;
    } catch (error) {
      console.error('Error processing match note:', error);
      return null;
    }
  }

  private validateMatchData(data: any): data is MatchNote {
    return (
      Array.isArray(data.players) &&
      data.players.length === 4 &&
      typeof data.shuttlecockCount === 'number' &&
      typeof data.score?.team1 === 'number' &&
      typeof data.score?.team2 === 'number' &&
      typeof data.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(data.date)
    );
  }

  async createMatchFromNote(noteData: MatchNote): Promise<string | null> {
    try {
      console.log('Creating match from note data:', noteData);
      
      // Mock database operations - in production this would use Supabase
      await mockDelay(800);

      // Mock match ID generation
      const mockMatchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('Mock match created with ID:', mockMatchId);

      return mockMatchId;
    } catch (error) {
      console.error('Error creating match from note:', error);
      return null;
    }
  }
}

export const ocrService = new OCRService();