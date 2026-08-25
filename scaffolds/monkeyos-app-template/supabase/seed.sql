-- Deterministic synthetic users. Never derive local seeds from production data.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'admin@example.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'member@example.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'outsider@example.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
values
  ('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '{"sub":"11111111-1111-4111-8111-111111111111","email":"admin@example.test"}', 'email', now(), now(), now(), 'a1111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '{"sub":"22222222-2222-4222-8222-222222222222","email":"member@example.test"}', 'email', now(), now(), now(), 'a2222222-2222-4222-8222-222222222222'),
  ('33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '{"sub":"33333333-3333-4333-8333-333333333333","email":"outsider@example.test"}', 'email', now(), now(), now(), 'a3333333-3333-4333-8333-333333333333');

insert into public.members(user_id, role, created_by)
values
  ('11111111-1111-4111-8111-111111111111', 'admin', null),
  ('22222222-2222-4222-8222-222222222222', 'member', '11111111-1111-4111-8111-111111111111');
