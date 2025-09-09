-- Create the 'attachments' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', TRUE) -- Set to TRUE for public access to files, or FALSE if you want to control access via signed URLs
ON CONFLICT (id) DO NOTHING;