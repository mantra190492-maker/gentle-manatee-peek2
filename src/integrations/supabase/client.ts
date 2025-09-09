import { createClient } from "@supabase/supabase-js";

const supabaseUrl: string = "https://rrspxekwbnuuzxvytafu.supabase.co";
const supabaseAnonKey: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyc3B4ZWt3Ym51dXp4dnl0YWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzA2NzQsImV4cCI6MjA3MDk0NjY3NH0.BTRu0I988siMDjm1qRPeJexUzH9jMwHymHVH1igyeeY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);