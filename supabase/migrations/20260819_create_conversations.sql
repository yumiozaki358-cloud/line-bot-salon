create table if not exists conversations (
  id          bigint generated always as identity primary key,
  user_id     text        not null,
  message     text        not null,
  bot_response text       not null,
  confidence  text        not null,
  escalated   boolean     not null default false,
  created_at  timestamptz not null default now()
);
