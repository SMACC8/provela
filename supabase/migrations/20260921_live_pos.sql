-- ═══════════════════════════════════════════════════════════════════════
-- Posizione Live su Supabase — tabella e due funzioni.
-- Da eseguire una volta sola nel SQL Editor del progetto.
--
-- Sostituisce Upstash Redis. Due differenze che governano tutto lo schema:
--
-- 1. POSTGRES NON HA IL TTL. Redis scadeva la chiave da solo; qui la
--    scadenza e' una colonna, `expires_at`, e chi legge la rispetta. Le
--    righe morte vengono raccolte dalla scrittura successiva: non serve un
--    cron per quattro righe.
--
-- 2. LA ANON KEY E' PUBBLICA. Sta nel sorgente di segui.html, come deve
--    essere: chi segue da terra non ha modo di inserirla. Quindi la
--    tabella e' chiusa — RLS attiva e NESSUNA policy — e si passa solo per
--    le due funzioni qui sotto, che sono `security definer`. Chi conosce
--    la anon key non puo' elencare le sessioni altrui: puo' solo chiedere
--    una sessione per nome, e i nomi sono casuali.
--
-- Il CODICE DI SCRITTURA (`p_secret`) chiude il buco che resterebbe
-- altrimenti: senza, chiunque abbia il link — e quindi il codice sessione
-- — potrebbe scrivere una posizione falsa, perche' la anon key ce l'ha
-- anche lui. Il codice lo genera la barca, sta solo sul suo dispositivo,
-- e non viaggia mai nel link. Vale la regola del primo arrivato: la prima
-- scrittura di una sessione registra il codice, le successive devono
-- combaciare. Una sessione scaduta si puo' riprendere: serve a non
-- restare chiusi fuori dalla propria sessione dopo aver rigenerato il
-- codice.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.live_pos (
  session    text primary key,
  payload    jsonb not null,
  secret     text not null,              -- impronta sha256, mai il codice in chiaro
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.live_pos enable row level security;
-- nessuna policy: nessun accesso diretto alla tabella, per nessun ruolo
revoke all on table public.live_pos from anon, authenticated;

-- ─────────────────────────────────────────────────────────── scrittura
create or replace function public.put_pos(
  p_session text,
  p_payload jsonb,
  p_ttl     int,
  p_secret  text
) returns void
language plpgsql
security definer
-- search_path fissato: su una funzione security definer lasciarlo libero
-- vuol dire lasciare che sia il chiamante a decidere quale `digest` viene
-- eseguita.
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  if p_session is null or length(p_session) < 4 then
    raise exception 'sessione mancante';
  end if;
  if p_secret is null or length(p_secret) < 12 then
    raise exception 'codice di scrittura mancante o troppo corto';
  end if;
  -- un ttl assurdo e' un errore del chiamante, non una richiesta da servire
  if p_ttl is null or p_ttl < 60 or p_ttl > 604800 then
    raise exception 'ttl fuori intervallo (60 s - 7 giorni)';
  end if;

  v_hash := encode(digest(p_secret, 'sha256'), 'hex');

  delete from public.live_pos where expires_at < now() - interval '1 day';

  -- Un solo comando invece di «leggi il codice, confronta, scrivi»: fra la
  -- lettura e la scrittura due primi invii simultanei si sovrascriverebbero
  -- a vicenda, e il secondo registrerebbe il proprio codice sopra il primo.
  insert into public.live_pos (session, payload, secret, expires_at)
  values (p_session, p_payload, v_hash, now() + make_interval(secs => p_ttl))
  on conflict (session) do update
     set payload    = excluded.payload,
         updated_at = now(),
         expires_at = excluded.expires_at
   where live_pos.secret = excluded.secret
      or live_pos.expires_at < now();

  if not found then
    raise exception 'codice di scrittura non valido per questa sessione';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────── lettura
create or replace function public.get_pos(p_session text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select payload from public.live_pos
   where session = p_session and expires_at > now();
$$;

-- Le funzioni nascono eseguibili da PUBLIC: si toglie e si concede a mano,
-- cosi' l'elenco di chi puo' chiamarle e' scritto qui e non implicito.
revoke execute on function public.put_pos(text, jsonb, int, text) from public;
revoke execute on function public.get_pos(text)                   from public;
grant  execute on function public.put_pos(text, jsonb, int, text) to anon, authenticated;
grant  execute on function public.get_pos(text)                   to anon, authenticated;
