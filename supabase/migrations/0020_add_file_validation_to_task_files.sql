-- Add mime_type column if it doesn't exist
ALTER TABLE public.task_files
ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Add size_bytes column if it doesn't exist (assuming it might be missing from previous migrations)
ALTER TABLE public.task_files
ADD COLUMN IF NOT EXISTS size_bytes BIGINT;

-- Add constraint for maximum file size (5 MB)
ALTER TABLE public.task_files
ADD CONSTRAINT task_files_size_limit
CHECK (size_bytes IS NULL OR size_bytes <= 5 * 1024 * 1024);

-- Add constraint to block audio and video file types
ALTER TABLE public.task_files
ADD CONSTRAINT task_files_no_av
CHECK (mime_type IS NULL OR (mime_type NOT LIKE 'audio/%' AND mime_type NOT LIKE 'video/%'));