create table if not exists menus (
  id          bigint generated always as identity primary key,
  name        text        not null,
  price       integer     not null check (price >= 0),
  description text,
  created_at  timestamptz not null default now()
);
