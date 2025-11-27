import { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Simple inline components to avoid external dependencies
const Button = ({ children, onClick, disabled, className = '', variant = 'default', size = 'default' }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none';
  const variantStyles = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50'
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

export default function QuickMatchNoteUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr/process-match-note', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process match note');
      }

      const data = await response.json();

      if (data.extractedData) {
        toast({
          title: 'Success',
          description: 'Match note processed successfully',
        });
        // Navigate to match notes page for verification
        router.push('/admin/match-notes');
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
      setFile(null);
      setPreview('');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Quick Match Note Upload</h3>
        {file && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFile(null);
              setPreview('');
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {!file ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="h-6 w-6 text-gray-400 mb-2" />
              <p className="text-xs text-gray-500">Drop note image or click to upload</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              disabled={loading}
            />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
              <Image
                src={preview}
                alt="Match note preview"
                fill
                className="object-contain rounded-lg"
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>
            
            <Button
              onClick={handleUpload}
              disabled={loading}
              className="w-full"
              size="sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Process Note
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}