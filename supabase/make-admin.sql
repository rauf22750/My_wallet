-- Create the first account in Supabase Authentication > Users > Add user.
-- Replace the email below, then run this once with database administrator access.
-- Sign out and sign in afterwards to refresh the user's role.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'REPLACE_WITH_ADMIN_EMAIL';
