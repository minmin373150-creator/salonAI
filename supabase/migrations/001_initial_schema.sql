-- ベクトル検索拡張（RAG用）
create extension if not exists vector;

-- ============================================
-- profiles テーブル（会員情報）
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "本人のみ自分のプロフィールを参照できる"
  on public.profiles for select
  using (auth.uid() = id);

create policy "本人のみ自分のプロフィールを更新できる"
  on public.profiles for update
  using (auth.uid() = id);

create policy "管理者はすべてのプロフィールを参照できる"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 新規会員登録時に自動でprofileを作成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', null)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at を自動更新するトリガー
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================
-- subscriptions テーブル（サブスク契約情報）
-- ============================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text not null default 'trialing'
    check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  plan_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "本人のみ自分のサブスク情報を参照できる"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_stripe_customer_id on public.subscriptions(stripe_customer_id);

-- ============================================
-- chat_sessions テーブル（チャット履歴・会話単位）
-- ============================================
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default '新しい相談',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_sessions enable row level security;

create policy "本人のみ自分のセッションを操作できる"
  on public.chat_sessions for all
  using (auth.uid() = user_id);

create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute procedure public.set_updated_at();

create index idx_chat_sessions_user_id on public.chat_sessions(user_id);

-- ============================================
-- chat_messages テーブル（メッセージ）
-- ============================================
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  file_urls text[],
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "セッション所有者のみメッセージを操作できる"
  on public.chat_messages for all
  using (
    exists (
      select 1 from public.chat_sessions
      where id = session_id and user_id = auth.uid()
    )
  );

create index idx_chat_messages_session_id on public.chat_messages(session_id);

-- ============================================
-- knowledge_base テーブル（みなみさんの知識・RAG用）
-- ============================================
create table public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  source_type text not null default 'text'
    check (source_type in ('pdf', 'text', 'audio_transcript')),
  source_file text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

alter table public.knowledge_base enable row level security;

-- 読み取りは全ログインユーザーOK（AIが参照するため）
create policy "ログインユーザーは知識ベースを参照できる"
  on public.knowledge_base for select
  using (auth.role() = 'authenticated');

-- 書き込みは管理者のみ
create policy "管理者のみ知識ベースを編集できる"
  on public.knowledge_base for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ベクトル検索用インデックス（コサイン類似度）
create index idx_knowledge_embedding
  on public.knowledge_base
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================
-- system_prompts テーブル（AIへの指示文・バージョン管理）
-- ============================================
create table public.system_prompts (
  id uuid primary key default gen_random_uuid(),
  version integer not null default 1,
  prompt_text text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.system_prompts enable row level security;

-- ログインユーザーはアクティブなプロンプトのみ参照可
create policy "ログインユーザーはアクティブなプロンプトを参照できる"
  on public.system_prompts for select
  using (auth.role() = 'authenticated' and is_active = true);

create policy "管理者はすべてのプロンプトを操作できる"
  on public.system_prompts for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- announcements テーブル（お知らせ）
-- ============================================
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "公開済みのお知らせは全員参照できる"
  on public.announcements for select
  using (is_published = true);

create policy "管理者はすべてのお知らせを操作できる"
  on public.announcements for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create trigger announcements_updated_at
  before update on public.announcements
  for each row execute procedure public.set_updated_at();

-- ============================================
-- contacts テーブル（問い合わせ）
-- ============================================
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

-- 誰でも問い合わせ送信OK（未ログインでも）
create policy "誰でも問い合わせを送信できる"
  on public.contacts for insert
  with check (true);

create policy "本人のみ自分の問い合わせを参照できる"
  on public.contacts for select
  using (auth.uid() = user_id);

create policy "管理者はすべての問い合わせを操作できる"
  on public.contacts for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- RAG検索用の関数
-- ============================================
create or replace function match_knowledge(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  similarity float
)
language sql stable
as $$
  select
    id,
    title,
    content,
    category,
    1 - (embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by (embedding <=> query_embedding) asc
  limit match_count;
$$;
