-- faq テーブル作成
create table if not exists faq (
  id        bigint generated always as identity primary key,
  question  text not null,
  answer    text not null,
  category  text not null,
  created_at timestamptz not null default now()
);

-- 初期データ（5件）
insert into faq (question, answer, category) values
  ('営業時間は？',               '平日10:00〜19:00、土日9:00〜18:00（火曜定休）',                                       '営業案内'),
  ('カットの値段は？',           'カット¥4,500〜（税込）',                                                              '料金'),
  ('予約取れますか？',           '現在オンライン予約は準備中です。お電話またはLINEでお問い合わせください',              '予約'),
  ('パーマとカラー同時にできますか？', '可能です。所要時間は目安2.5〜3時間です',                                       '施術'),
  ('駐車場はありますか？',       '店舗前に2台分ございます',                                                            'アクセス');
