-- Create pre_orders table for jersey pre-orders
CREATE TABLE IF NOT EXISTS public.pre_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  ukuran TEXT NOT NULL CHECK (ukuran IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL')),
  warna TEXT NOT NULL CHECK (warna IN ('biru', 'pink', 'kuning')),
  lengan TEXT DEFAULT 'short' CHECK (lengan IN ('short', 'long')),
  nama_punggung TEXT,
  tanpa_nama_punggung BOOLEAN DEFAULT false,
  harga INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pre_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert for pre_orders" ON public.pre_orders;
DROP POLICY IF EXISTS "Allow authenticated users to view pre_orders" ON public.pre_orders;
DROP POLICY IF EXISTS "Allow authenticated users to update pre_orders" ON public.pre_orders;

-- Create policy to allow anyone to insert (for public pre-order form)
CREATE POLICY "Allow public insert for pre_orders" ON public.pre_orders
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow authenticated users to view all pre_orders (for admin)
CREATE POLICY "Allow authenticated users to view pre_orders" ON public.pre_orders
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to update pre_orders (for admin)
CREATE POLICY "Allow authenticated users to update pre_orders" ON public.pre_orders
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_pre_orders_created_at ON public.pre_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pre_orders_status ON public.pre_orders(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_pre_orders_updated_at ON public.pre_orders;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_pre_orders_updated_at
  BEFORE UPDATE ON public.pre_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();