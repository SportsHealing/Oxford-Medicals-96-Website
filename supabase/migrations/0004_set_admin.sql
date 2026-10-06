-- Lets an admin promote or demote another member from the Admin page.
-- The is_admin column itself stays locked against direct edits (migration 0002).
create or replace function public.set_admin(target uuid, make_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this';
  end if;
  if not make_admin and target = auth.uid() then
    raise exception 'You cannot remove your own admin access';
  end if;
  update public.members set is_admin = make_admin where id = target;
end;
$$;

revoke all on function public.set_admin(uuid, boolean) from public, anon;
grant execute on function public.set_admin(uuid, boolean) to authenticated;
