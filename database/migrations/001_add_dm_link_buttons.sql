alter table keyword_rules
  add column if not exists link_button_text text,
  add column if not exists link_url text;

alter table dm_logs
  add column if not exists link_button_text text,
  add column if not exists link_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'keyword_rules_link_button_complete'
  ) then
    alter table keyword_rules
      add constraint keyword_rules_link_button_complete check (
        (link_button_text is null and link_url is null) or
        (length(trim(coalesce(link_button_text, ''))) > 0 and link_url ~* '^https?://')
      );
  end if;
end $$;
