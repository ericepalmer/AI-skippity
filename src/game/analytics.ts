/**
 * Ping DreamHost PHP counter when a new game is dealt.
 * Fails silently in local Vite (no PHP) or if the network blocks it.
 */
export function recordGameStart(): void {
  const url = `${import.meta.env.BASE_URL}hit.php?event=game_start`
  void fetch(url, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'omit',
  }).catch(() => {
    /* ignore — local dev / offline */
  })
}
