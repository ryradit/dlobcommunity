import { Router, Request, Response } from 'express';

const router = Router();

// Simple mock authentication middleware
const authenticateAdmin = (req: Request, res: Response, next: any) => {
  // For now, we'll skip authentication
  // In production, you would implement proper JWT/session validation
  console.log('Mock admin authentication - passed');
  next();
};

// Simple file validation without multer
const validateImageUpload = (req: Request, res: Response, next: any) => {
  // Mock validation - in production you'd implement proper file handling
  console.log('Mock image validation - passed');
  next();
};

router.post('/process-match-note', authenticateAdmin, validateImageUpload, async (req: Request, res: Response) => {
  try {
    console.log('Processing match note - Backend OCR route called');

    // Mock image processing - in production this would handle actual file upload
    // For now, we'll simulate the OCR processing

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock extracted data
    const mockMatchData = {
      date: new Date().toISOString().split('T')[0],
      time: "14:30",
      fieldNumber: 2,
      team1: {
        player1: "Ahmad",
        player2: "Budi", 
        score: 21
      },
      team2: {
        player1: "Charlie",
        player2: "David",
        score: 18
      },
      shuttlecockCount: 2
    };

    console.log('Mock OCR processing completed:', mockMatchData);

    // Mock match ID generation
    const mockMatchId = `match_${Date.now()}`;

    return res.json({
      success: true,
      matchId: mockMatchId,
      matchData: mockMatchData,
      imageUrl: `mock://processed-image-${Date.now()}.jpg`,
      message: 'Match note processed successfully (backend mock)'
    });

  } catch (error) {
    console.error('Error processing match note:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;