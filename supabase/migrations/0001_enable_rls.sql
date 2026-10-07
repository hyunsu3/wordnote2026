-- 모든 public 테이블에 RLS 활성화 + anon/authenticated 권한 회수.
-- 앱은 서버(service_role)로만 DB에 접근하므로 정책(policy)이 없으면 anon 키로는 어떤 접근도 불가능하다.
-- 주의: 새 코드(API 라우트 + SUPABASE_SERVICE_ROLE_KEY 환경변수)를 먼저 배포한 뒤에 실행할 것.

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('revoke all on table public.%I from anon, authenticated', t.tablename);
  end loop;
end $$;

-- 이후 생성되는 테이블에도 anon/authenticated 기본 권한이 붙지 않도록
alter default privileges in schema public revoke all on tables from anon, authenticated;
