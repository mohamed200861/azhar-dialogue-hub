import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'ashmawi.2009@gmail.com',
  password: 'mohamed2009',
});
if (error) throw error;

if (data.session) {
  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}

const uid = data.user?.id;
const rolesRes = await supabase.from('user_roles').select('role').eq('user_id', uid);
const adminRes = await supabase.from('admin_users').select('is_active').eq('user_id', uid).maybeSingle();
await supabase.auth.signOut();
console.log(JSON.stringify({
  uid,
  roles: rolesRes.data || [],
  rolesError: rolesRes.error?.message || null,
  admin: adminRes.data || null,
  adminError: adminRes.error?.message || null
}, null, 2));
