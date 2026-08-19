-- confidence カラムを integer 型に変更するため再作成
drop table if exists conversations;

create table conversations (
  id          bigint generated always as identity primary key,
  user_id     text        not null,
  message     text        not null,
  bot_response text       not null,
  confidence  integer     not null,
  escalated   boolean     not null default false,
  created_at  timestamptz not null default now()
);
