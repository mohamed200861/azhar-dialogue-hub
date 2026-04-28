import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = 'ashmawi.2009@gmail.com';

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (error) throw error;

const user = data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
console.log(JSON.stringify(user ? {
  exists: true,
  id: user.id,
  email_confirmed: Boolean(user.email_confirmed_at),
  banned: Boolean(user.banned_until),
  last_sign_in_at: user.last_sign_in_at ?? null
} : { exists: false }, null, 2));
