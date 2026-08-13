-- 請到 Supabase 專案的 SQL Editor 貼上並執行這段指令，建立資料表

create table if not exists studio_data (
  id text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 開啟 Row Level Security，並允許使用 anon key 讀寫（適合單一工作室內部使用）
-- 若未來需要帳號登入權限控管，可再另外調整這裡的政策
alter table studio_data enable row level security;

drop policy if exists "allow all for anon" on studio_data;
create policy "allow all for anon"
  on studio_data
  for all
  using (true)
  with check (true);

-- 建立初始的資料列（程式會自動 upsert，這行非必要，但先建立可避免第一次讀取時是空的）
insert into studio_data (id, value)
values ('main', '{"families":[],"slots":[],"templates":[]}'::jsonb)
on conflict (id) do nothing;
