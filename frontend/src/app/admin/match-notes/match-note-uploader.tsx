import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Edit, Upload, List, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

// Simple inline components to avoid external dependencies
const Button = ({ children, onClick, disabled, className = '', variant = 'default', size = 'default' }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm';
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none';
  const variantStyles = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
    ghost: 'hover:bg-gray-100 hover:text-gray-900'
  };
  const sizeStyles = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 text-sm'
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

const Card = ({ children, className = '' }: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`rounded-lg border bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const toast = ({ title, description, variant }: {
  title: string;
  description?: string;
  variant?: 'destructive';
}) => {
  const message = description ? `${title}: ${description}` : title;
  if (variant === 'destructive') {
    alert(`Error: ${message}`);
  } else {
    alert(message);
  }
};

interface Member {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

interface ProcessedNote {
  id: string;
  image_url: string;
  processed_data: ExtractedMatchData;
  created_at: string;
  status: 'pending' | 'verified' | 'error';
  accuracy_score: number;
}

interface ExtractedMatchData {
  date: string;
  time: string;
  fieldNumber: number;
  team1: {
    player1: string;
    player2: string;
    score: number;
  };
  team2: {
    player1: string;
    player2: string;
    score: number;
  };
  shuttlecockCount: number;
}

export default function MatchNoteUploader() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedMatchData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedMatchData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [processedNotes, setProcessedNotes] = useState<ProcessedNote[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch members for autocomplete
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Mock members data for now
        const mockMembers = [
          { id: '1', name: 'John Doe', email: 'john@example.com', is_active: true },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', is_active: true },
        ];
        setMembers(mockMembers);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    fetchMembers();
  }, []);

  // Fetch processed notes history
  useEffect(() => {
    const fetchProcessedNotes = async () => {
      try {
        // Mock processed notes for now
        setProcessedNotes([]);
      } catch (error) {
        console.error('Error fetching processed notes:', error);
      }
    };

    fetchProcessedNotes();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    
    if (files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleMemberSelect = (field: string, memberId: string) => {
    const selectedMember = members.find(m => m.id === memberId);
    if (selectedMember && editedData) {
      handleUpdateField(field, selectedMember.name);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one image',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // For now, process only the first file
      // TODO: Implement batch processing
      const formData = new FormData();
      formData.append('image', selectedFiles[0]);

      const response = await fetch('/api/ocr/process-match-note', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process match note');
      }

      const data = await response.json();

      if (data.extractedData) {
        setExtractedData(data.extractedData);
        setEditedData(data.extractedData);
        toast({
          title: 'Success',
          description: 'Match note processed. Please verify the extracted data.',
        });
      } else {
        throw new Error('No data extracted from image');
      }
    } catch (error) {
      console.error('Error uploading match note:', error);
      toast({
        title: 'Error',
        description: 'Failed to process match note',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMatch = async () => {
    if (!editedData) return;

    setLoading(true);
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: editedData.date,
          time: editedData.time,
          field_number: editedData.fieldNumber,
          team1_player1: editedData.team1.player1,
          team1_player2: editedData.team1.player2,
          team2_player1: editedData.team2.player1,
          team2_player2: editedData.team2.player2,
          team1_score: editedData.team1.score,
          team2_score: editedData.team2.score,
          shuttlecock_count: editedData.shuttlecockCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save match');
      }

      toast({
        title: 'Success',
        description: 'Match saved successfully',
      });

      // Reset form
      setSelectedFiles([]);
      setPreview('');
      setExtractedData(null);
      setEditedData(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving match:', error);
      toast({
        title: 'Error',
        description: 'Failed to save match',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (field: string, value: string | number) => {
    if (!editedData) return;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditedData({
        ...editedData,
        [parent]: {
          ...(editedData[parent as keyof ExtractedMatchData] as any),
          [child]: value
        }
      });
    } else {
      setEditedData({
        ...editedData,
        [field]: value
      });
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Upload Match Notes</h2>
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
        >
          <List className="h-4 w-4 mr-2" />
          {showHistory ? 'Hide History' : 'Show History'}
        </Button>
      </div>
      
      {!showHistory ? (
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Select Match Note Images
            </label>
            <Input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              disabled={loading || extractedData !== null}
              multiple
              className="cursor-pointer"
            />
            <p className="text-sm text-gray-600">
              You can select multiple images for batch processing
            </p>
          </div>

          {preview && (
            <div className="relative aspect-video w-full max-w-md mx-auto">
              <Image
                src={preview}
                alt="Match note preview"
                fill
                className="object-contain"
              />
            </div>
          )}

          {selectedFiles.length > 0 && !extractedData && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {selectedFiles.length} file(s) selected
              </p>
              <Button
                onClick={handleUpload}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Process {selectedFiles.length} Note{selectedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}

          {extractedData && editedData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Extracted Match Data</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Done Editing
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Data
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <Input
                      type="date"
                      value={editedData.date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField('date', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <Input
                      type="time"
                      value={editedData.time}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField('time', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Field Number</label>
                    <Input
                      type="number"
                      value={editedData.fieldNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField('fieldNumber', parseInt(e.target.value) || 0)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Team 1</label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Player 1"
                        value={editedData.team1.player1}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField('team1.player1', e.target.value)}
                        disabled={!isEditing}
                      />
                      <Input
                        placeholder="Player 2"
                        value={editedData.team1.player2}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField('team1.player2', e.target.value)}
                        disabled={!isEditing}
                      />

                      <Input
                        type="number"
                        placeholder="Score"
                        value={editedData.team1.score}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField('team1.score', parseInt(e.target.value) || 0)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Team 2</label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Player 1"
                        value={editedData.team2.player1}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField('team2.player1', e.target.value)}
                        disabled={!isEditing}
                      />
                      <Input
                        placeholder="Player 2"
                        value={editedData.team2.player2}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField('team2.player2', e.target.value)}
                        disabled={!isEditing}
                      />

                      <Input
                        type="number"
                        placeholder="Score"
                        value={editedData.team2.score}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField('team2.score', parseInt(e.target.value) || 0)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Shuttlecock Count</label>
                    <Input
                      type="number"
                      value={editedData.shuttlecockCount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField('shuttlecockCount', parseInt(e.target.value) || 0)}
                      disabled={!isEditing}
                    />
                </div>
              </div>
            </div>

            {/* Validation warnings */}
            {editedData && (
              <div className="space-y-2">
                {(!editedData.date || !editedData.time) && (
                  <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm">Date and time are required</p>
                  </div>
                )}
                {(!editedData.team1.player1 || !editedData.team1.player2 || !editedData.team2.player1 || !editedData.team2.player2) && (
                  <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm">All player names are required</p>
                  </div>
                )}
                {(editedData.team1.score === 0 && editedData.team2.score === 0) && (
                  <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm">At least one team should have a score</p>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleSaveMatch}
              disabled={loading || isEditing || !editedData || 
                !editedData.date || !editedData.time ||
                !editedData.team1.player1 || !editedData.team1.player2 ||
                !editedData.team2.player1 || !editedData.team2.player2 ||
                (editedData.team1.score === 0 && editedData.team2.score === 0)}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Match'
              )}
            </Button>
          </div>
        )}
      </Card>
      ) : (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Processed Match Notes</h3>
              <p className="text-sm text-gray-600">
                {processedNotes.length} note{processedNotes.length !== 1 ? 's' : ''} processed
              </p>
            </div>

            <div className="space-y-4">
              {processedNotes.map((note) => (
                <div
                  key={note.id}
                  className={`border rounded-lg p-4 ${
                    note.status === 'verified'
                      ? 'border-green-200 bg-green-50'
                      : note.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">
                        Match on {new Date(note.processed_data.date).toLocaleDateString()}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {note.processed_data.team1.player1} & {note.processed_data.team1.player2} vs{' '}
                        {note.processed_data.team2.player1} & {note.processed_data.team2.player2}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Score: {note.processed_data.team1.score} - {note.processed_data.team2.score}
                      </p>
                    </div>
                    <div className="text-right">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          note.status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : note.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {note.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Accuracy: {Math.round(note.accuracy_score * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(note.image_url, '_blank')}
                    >
                      View Original
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}