create table if not exists broadcasts (
  id               bigint generated always as identity primary key,
  message          text        not null,
  sent_at          timestamptz not null default now(),
  recipient_count  integer
);
