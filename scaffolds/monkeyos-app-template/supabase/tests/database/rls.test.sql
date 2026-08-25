begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(8);

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
select extensions.is_empty($$ select user_id from public.members $$, 'non-member cannot read memberships');

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select extensions.results_eq($$ select count(*)::bigint from public.members $$, $$ values (1::bigint) $$, 'member sees only own membership');
select extensions.is_empty($$ update public.members set role = 'admin' where user_id = '22222222-2222-4222-8222-222222222222' returning user_id $$, 'member cannot elevate own role');

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select extensions.results_eq($$ select count(*)::bigint from public.members $$, $$ values (2::bigint) $$, 'admin sees all members');
select extensions.lives_ok($$ select public.add_member_by_email('outsider@example.test', 'member') $$, 'admin adds an existing exact-email Auth user');
select extensions.results_eq($$ select role from public.members where user_id = '33333333-3333-4333-8333-333333333333' $$, $$ values ('member'::text) $$, 'exact-email operation creates local membership only');
select extensions.throws_ok(
  $$ update public.members set role = 'member' where user_id = '11111111-1111-4111-8111-111111111111' $$,
  '23514', null, 'final application admin cannot be demoted'
);
select extensions.lives_ok($$ delete from public.members where user_id = '33333333-3333-4333-8333-333333333333' $$, 'admin can remove another member');

select * from extensions.finish();
rollback;
