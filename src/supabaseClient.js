import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hgmvmpzntxrdwzqvakws.supabase.co'; // Substitua pela URL do seu projeto Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnbXZtcHpudHhyZHd6cXZha3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTA3MDAsImV4cCI6MjA3Mjc2NjcwMH0.kI0Z0LCcwn48zjFVTkUCk3Pe9-zaW6QF8wuI1tnekS4'; // Substitua pela chave pública do seu projeto Supabase

export const supabase = createClient(supabaseUrl, supabaseKey);
