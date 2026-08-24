begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(12);

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
select extensions.is_empty($$ select id from monkeyos_app_template.work_items $$, 'non-member cannot read work items');
select extensions.is_empty($$ select user_id from monkeyos_app_template.members $$, 'non-member cannot read memberships');
select extensions.throws_ok(
  $$ insert into monkeyos_app_template.work_items(title, created_by) values ('Denied', '33333333-3333-4333-8333-333333333333') $$,
  '42501', null, 'non-member cannot create work items'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select extensions.results_eq($$ select count(*)::bigint from monkeyos_app_template.work_items $$, $$ values (3::bigint) $$, 'member can read all app work items');
select extensions.results_eq($$ select count(*)::bigint from monkeyos_app_template.members $$, $$ values (1::bigint) $$, 'member sees only own membership');
select extensions.lives_ok($$ insert into monkeyos_app_template.work_items(id, title, created_by) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'Member item', '22222222-2222-4222-8222-222222222222') $$, 'member can create own work item');
select extensions.is_empty($$ delete from monkeyos_app_template.work_items where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4' returning id $$, 'member cannot delete work item');

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select extensions.results_eq($$ select count(*)::bigint from monkeyos_app_template.members $$, $$ values (2::bigint) $$, 'admin sees all members');
select extensions.lives_ok($$ select monkeyos_app_template.add_member_by_email('outsider@example.test', 'member') $$, 'admin adds an existing exact-email Auth user');
select extensions.results_eq($$ select role from monkeyos_app_template.members where user_id = '33333333-3333-4333-8333-333333333333' $$, $$ values ('member'::text) $$, 'exact-email operation creates local membership only');
select extensions.cmp_ok((select count(*) from monkeyos_app_template.audit_log where action = 'membership.insert'), '>=', 3::bigint, 'membership changes are audited');
select extensions.lives_ok($$ delete from monkeyos_app_template.work_items where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4' $$, 'admin can delete work item');

select * from extensions.finish();
rollback;
