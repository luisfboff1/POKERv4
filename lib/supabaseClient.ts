import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE')) {
  console.warn(
    'Missing Supabase environment variables. ' +
    'Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
  );
}

const dummyUrl = 'https://placeholder.supabase.co';
const dummyKey = 'placeholder-key';

// Use createBrowserClient from @supabase/ssr which automatically handles cookies
export const supabase = createBrowserClient(
  supabaseUrl && !supabaseUrl.includes('YOUR_SUPABASE') ? supabaseUrl : dummyUrl,
  supabaseAnonKey && !supabaseAnonKey.includes('YOUR_SUPABASE') ? supabaseAnonKey : dummyKey
);

export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tenants')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }

    console.log('Supabase connection successful');
    return true;
  } catch (connectionError) {
    console.error('Supabase connection error:', connectionError);
    return false;
  }
};

export const setSupabaseAuth = (token: string) => {
  return supabase.auth.setSession({
    access_token: token,
    refresh_token: token,
  });
};

export const clearSupabaseAuth = async () => {
  await supabase.auth.signOut();
};

export const getSupabaseSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Failed to get Supabase session:', error);
    return null;
  }

  return data.session;
};
