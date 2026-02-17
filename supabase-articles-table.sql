-- Articles table with complete structure
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- Content (stored as JSON structure)
  content JSONB NOT NULL,
  -- Structure: {
  --   hero_image: { url, alt, prompt },
  --   intro: "text",
  --   sections: [
  --     { heading, content, image: { url, alt, prompt } }
  --   ],
  --   conclusion: "text",
  --   cta_image: { url, alt, prompt }
  -- }
  
  -- Metadata
  category TEXT NOT NULL,
  tags TEXT[],
  excerpt TEXT,
  read_time_minutes INTEGER,
  
  -- Author
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  
  -- AI Generation Data
  original_prompt TEXT, -- What admin typed
  generation_model TEXT DEFAULT 'gemini-2.5-flash-lite',
  
  -- Publishing
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Analytics
  views INTEGER DEFAULT 0,
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_author ON articles(author_id);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can read published articles
CREATE POLICY "Published articles are viewable by everyone"
  ON articles FOR SELECT
  USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins can do everything with articles"
  ON articles FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(title, 
          'ÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÈÉÊËèéêëÇçÌÍÎÏìíîïÙÚÛÜùúûüÿÑñ',
          'AAAAAAaaaaaaOOOOOOooooooEEEEeeeeCcIIIIiiiiUUUUuuuuyNn'
        ), 
        '[^a-z0-9]+', '-', 'g'
      ),
      '^-|-$', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE articles IS 'AI-generated articles with structured content and images';
COMMENT ON COLUMN articles.content IS 'JSONB structure with hero image, sections with images, and CTA';
COMMENT ON COLUMN articles.original_prompt IS 'The single prompt used to generate the article';

-- Function to increment article views
CREATE OR REPLACE FUNCTION increment_article_views(article_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE articles
  SET views = views + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_article_views IS 'Increment view count for an article';

