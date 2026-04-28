import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'ashmawi.2009@gmail.com',
  password: 'mohamed2009',
});

if (error) {
  console.log(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(0);
}

const uid = data.user?.id;
const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', uid);
const { data: admin } = await supabase.from('admin_users').select('is_active').eq('user_id', uid).maybeSingle();
await supabase.auth.signOut();
console.log(JSON.stringify({
  ok: true,
  uid,
  roles: (roles || []).map((r) => r.role),
  admin_is_active: admin?.is_active ?? null
}, null, 2));
