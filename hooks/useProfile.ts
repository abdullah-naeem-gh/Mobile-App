import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Profile {
  profile_id: number;
  user_id: string;
  role: 'consumer' | 'brand';
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [session?.user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    userRole: profile?.role || null,
  };
};
