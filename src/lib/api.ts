/**
 * Base URL for the ZKPVP API. Falls back to the local API dev server when
 * `VITE_API_BASE` is not set (e.g. in tests or a bare `vite dev` run without
 * an `.env`). Every API call in the app should go through this module so the
 * base URL stays a single source of truth.
 */
export const API_BASE: string =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

/**
 * Thin `fetch` wrapper shared by every API call: resolves relative paths
 * against {@link API_BASE}, parses JSON responses, and throws {@link ApiError}
 * on any non-2xx status so callers can rely on `await` + `try/catch` instead
 * of checking `response.ok` everywhere.
 *
 * `credentials: 'include'` is required here: the web app and API are
 * different origins, and the backend's CORS config (Task 3) is
 * `cors({ origin: WEB_ORIGIN, credentials: true })` specifically so the
 * browser will send/receive the httpOnly `session` cookie cross-origin.
 * Without this, the cookie never attaches and every authenticated call
 * (`getMe()`, `getLinkCode()`, future order/staff calls) silently behaves
 * as logged-out even when the user genuinely has a valid session.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  })

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? await response.json().catch(() => undefined)
    : undefined

  if (!response.ok) {
    throw new ApiError(
      `Request to ${url} failed with status ${response.status}`,
      response.status,
      body,
    )
  }

  return body as T
}

export type RankingMode = 'diario' | 'semanal' | 'mensal' | 'mvp'

export interface RankingEntry {
  position: number
  playerId: string
  displayName: string
  clanTag: string | null
  eliminations: number
  wins: number
  prizesText: string | null
}

export interface RankingResponse {
  mode: RankingMode
  stage: string | null
  entries: RankingEntry[]
}

/**
 * Fetches the leaderboard for a given mode (and, optionally, a specific
 * event stage) from `GET /api/ranking`.
 */
export function getRanking(
  mode: RankingMode,
  stage?: string,
): Promise<RankingResponse> {
  const params = new URLSearchParams({ mode })
  if (stage) params.set('stage', stage)
  return apiFetch<RankingResponse>(`/api/ranking?${params.toString()}`)
}

export type PlayerSearchMode = 'global' | 'duo' | 'squad'

export interface PlayerSummary {
  id: string
  displayName: string
  clanTag: string | null
  rating: number
  matches: number
  kd: number
  wins: number
  avgKills: number
  fivemLicense?: string | null
  discordAvatarUrl?: string | null
  /**
   * Only present on the `/auth/me` shape (see `toPlayerSummary` in
   * `apps/api/src/routes/auth.ts`), not on `/api/players` leaderboard
   * entries. Optional here since `PlayerSummary` is shared across both.
   */
  discordUsername?: string
}

export interface PlayersResponse {
  players: PlayerSummary[]
}

/**
 * Fetches players for the Descobrir page from `GET /api/players`. Unlike
 * `getRanking`, this endpoint never 400s on a bad/missing `mode` (it
 * defaults to `global` server-side) — `mode` is always sent regardless.
 */
export function getPlayers(
  search: string,
  mode: PlayerSearchMode,
): Promise<PlayersResponse> {
  const params = new URLSearchParams({ mode })
  if (search) params.set('search', search)
  return apiFetch<PlayersResponse>(`/api/players?${params.toString()}`)
}

interface MeResponse {
  player: PlayerSummary
}

/**
 * Fetches the current session's player from `GET /auth/me`. A `401` means
 * "not logged in" — a normal, expected state, not a failure — so it
 * resolves to `null` instead of rejecting. Any other error (network
 * failure, 5xx, etc.) still rejects via {@link ApiError} so callers can
 * distinguish "logged out" from "something broke".
 */
export async function getMe(): Promise<PlayerSummary | null> {
  try {
    const { player } = await apiFetch<MeResponse>('/auth/me')
    return player
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

export function logoutPlayer(): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' })
}

export interface AccountDashboardResponse {
  profile: {
    id: string
    displayName: string
    discordUsername: string
    discordAvatarUrl: string | null
    linkedToFiveM: boolean
    clanTag: string | null
    createdAt: string
  }
  stats: Record<string, {
    matches: number
    wins: number
    kd: number
    avgKills: number
    rating: number
    ranked: boolean
  }>
  globalPosition: number | null
  entitlements: Array<{
    id: string
    kind: 'vip' | 'skin' | 'vehicle'
    key: string
    durationUnit: 'days' | 'months' | 'years' | 'lifetime'
    grantedAt: string
    expiresAt: string | null
  }>
  recentResults: Array<{
    mode: string
    stage: string
    position: number
    eliminations: number
    wins: number
    updatedAt: string
  }>
}

export function getAccountDashboard(): Promise<AccountDashboardResponse> {
  return apiFetch<AccountDashboardResponse>('/api/account/dashboard')
}

export interface LinkCodeResponse {
  code: string
  expiresAt: string
}

/**
 * Requests a fresh Discord<->FiveM pairing code from `GET /api/link/code`
 * (Task 14). Requires an authenticated session; the caller is responsible
 * for only invoking this once the player is known to be logged in (see
 * `Cadastro.tsx`, which defers the call until step 3 is entered so a code
 * — and its 10-minute clock — isn't generated before the player even gets
 * there).
 */
export function getLinkCode(): Promise<LinkCodeResponse> {
  return apiFetch<LinkCodeResponse>('/api/link/code')
}

export interface ClaimFivemTokenResponse {
  ok: boolean
  alreadyLinked?: boolean
}

/** Claims the temporary token displayed to this player by the FiveM server. */
export function claimFivemToken(token: string): Promise<ClaimFivemTokenResponse> {
  return apiFetch<ClaimFivemTokenResponse>('/api/link/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}

export interface StoreItem {
  id: string
  name: string
  description: string
  priceCents: number
  category: string
  itemKey?: string | null
  imageUrl: string | null
  active: boolean
  stockQuantity: number | null
}

export interface StoreItemsResponse {
  items: StoreItem[]
}

export interface SaveStoreItemInput {
  name: string
  description: string
  priceCents: number
  category: string
  itemKey?: string | null
  imageUrl: string | null
  stockQuantity: number | null
  active: boolean
}

export function getStaffStoreItems(): Promise<StoreItemsResponse> {
  return apiFetch<StoreItemsResponse>('/staff/store-items')
}

export function createStaffStoreItem(input: SaveStoreItemInput): Promise<{ item: StoreItem }> {
  return apiFetch<{ item: StoreItem }>('/staff/store-items', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  })
}

export function updateStaffStoreItem(id: string, input: SaveStoreItemInput): Promise<{ item: StoreItem }> {
  return apiFetch<{ item: StoreItem }>(`/staff/store-items/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  })
}

export function deactivateStaffStoreItem(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/staff/store-items/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** Fetches the store catalog for the Loja page from `GET /api/store/items`. */
export function getStoreItems(): Promise<StoreItemsResponse> {
  return apiFetch<StoreItemsResponse>('/api/store/items')
}

export interface OrderLineItem {
  storeItemId: string
  quantity: number
}

export interface Order {
  id: string
  status: string
  totalCents: number
  paymentAvailable: boolean
  items: OrderLineItem[]
}

export interface CreateOrderResponse {
  order: Order
}

/**
 * Submits a checkout from the Loja page's cart to
 * `POST /api/store/orders` (Task 17). Requires an authenticated session —
 * the caller is responsible for only invoking this once the player is known
 * to be logged in (see `Loja.tsx`, which redirects to Discord login instead
 * of calling this when logged out). The request body is exactly
 * `{ items: [{ storeItemId, quantity }] }`, matching Task 17's expected
 * input; an empty `items` array gets back `400 { error: "empty_order" }`.
 */
export function createOrder(items: OrderLineItem[], idempotencyKey: string = crypto.randomUUID()): Promise<CreateOrderResponse> {
  return apiFetch<CreateOrderResponse>('/api/store/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, idempotencyKey }),
  })
}

/**
 * Named `CalendarEvent` (not `Event`) to avoid shadowing the DOM `Event`
 * global type throughout the web app.
 */
export interface CalendarEvent {
  id: string
  title: string
  description: string
  category: string
  startsAt: string
  prizeText: string | null
  featured: boolean
  createdAt: string
}

export interface EventsResponse {
  events: CalendarEvent[]
  featured: CalendarEvent | null
}

/**
 * Fetches events for the Calendário page from `GET /api/events` (Task 11).
 * `from`/`to` are optional ISO date strings; omitting both returns the full
 * set. `featured` is server-selected (the next upcoming event flagged
 * `featured = true`) and is `null` when none qualifies.
 */
export function getEvents(from?: string, to?: string): Promise<EventsResponse> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString()
  return apiFetch<EventsResponse>(`/api/events${query ? `?${query}` : ''}`)
}

export interface HallOfFameEntry {
  id: string
  eventName: string
  championName: string
  championTag: string | null
  prizeText: string | null
  wonAt: string
}

export interface HallOfFameResponse {
  entries: HallOfFameEntry[]
}

/** Fetches past champions for the Calendário page from `GET /api/hall-of-fame` (Task 11). */
export function getHallOfFame(): Promise<HallOfFameResponse> {
  return apiFetch<HallOfFameResponse>('/api/hall-of-fame')
}

/**
 * Named `ChangelogItem` (not `ChangelogEntry`) so it doesn't collide with
 * the `ChangelogEntry` *component* that renders it — `Atualizacoes.tsx`
 * imports both.
 */
export interface ChangelogItem {
  id: string
  version: string
  title: string
  publishedAt: string
  categories: string[]
  body: string
}

export interface ChangelogResponse {
  entries: ChangelogItem[]
}

/**
 * Fetches changelog entries for the Atualizações page from
 * `GET /api/changelog` (Task 11). `category`, when given, must be one of
 * the four taxonomy strings seeded by Task 7: `novidades`, `melhorias`,
 * `correcoes`, `importantes`. `search` matches server-side against title
 * and body (case-insensitive substring).
 */
export function getChangelog(
  category?: string,
  search?: string,
): Promise<ChangelogResponse> {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (search) params.set('search', search)
  const query = params.toString()
  return apiFetch<ChangelogResponse>(`/api/changelog${query ? `?${query}` : ''}`)
}

// --- staff (Task 20/21) -----------------------------------------------

export interface StaffLoginResponse {
  ok: true
}

/**
 * Logs a staff member in via `POST /staff/login` (Task 20). On success the
 * server sets the httpOnly `staff_session` cookie (picked up automatically
 * by `apiFetch`'s `credentials: 'include'`); on a bad username/password it
 * rejects with `ApiError` (`status === 401`, body `{ error:
 * "invalid_credentials" }`) — deliberately never a field-level error, since
 * the backend never reveals *which* field was wrong.
 */
export function staffLogin(
  username: string,
  password: string,
): Promise<StaffLoginResponse> {
  return apiFetch<StaffLoginResponse>('/staff/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

/** Validates the httpOnly staff session before showing the dashboard. */
export function checkStaffSession(): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>('/staff/session')
}

export interface ChangelogEntryInput {
  version: string
  title: string
  publishedAt: string
  categories: string[]
  body: string
}

export interface CreateChangelogEntryResponse {
  entry: ChangelogItem
}

/**
 * Creates a changelog entry via `POST /staff/changelog` (Task 20,
 * `requireStaff`-protected). A `400` rejects with `ApiError` whose `body` is
 * `{ error: "validation_error", fields: { <field>: <message> } }` — callers
 * render `fields` next to the matching input rather than a generic banner.
 */
export function createChangelogEntry(
  input: ChangelogEntryInput,
): Promise<CreateChangelogEntryResponse> {
  return apiFetch<CreateChangelogEntryResponse>('/staff/changelog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export interface EventInput {
  title: string
  description: string
  category: string
  startsAt: string
  prizeText: string | null
  featured: boolean
}

export interface CreateEventResponse {
  event: CalendarEvent
}

/**
 * Creates an event via `POST /staff/events` (Task 20, `requireStaff`-
 * protected). Same `400 validation_error` / `fields` shape as
 * {@link createChangelogEntry}.
 */
export function createEvent(input: EventInput): Promise<CreateEventResponse> {
  return apiFetch<CreateEventResponse>('/staff/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export interface ServerStatusResponse {
  online: number | null
  lastUpdated: string | null
}

/**
 * Fetches the live player count for the home hero from
 * `GET /api/server-status` (Task 12). `online`/`lastUpdated` are `null`
 * before the backend's first successful poll of the FiveM server — a
 * normal startup state, not an error — so callers must render a
 * placeholder for `null` rather than treating it as a failed fetch.
 */
export function getServerStatus(): Promise<ServerStatusResponse> {
  return apiFetch<ServerStatusResponse>('/api/server-status')
}

/**
 * Dynamic key -> value map mirroring the `home_stats` table directly
 * (Task 7 seeds `contas_criadas`, `premiacao_total`, `campeonatos`, `clas`,
 * `banidos`). Unlike every other response in this file, these keys stay
 * snake_case on purpose — see `GET /api/home-stats`'s doc comment in
 * `apps/api/src/routes/homeStats.ts` for why.
 */
export interface HomeStatsResponse {
  stats: Record<string, string>
}

/**
 * Fetches the home page's scoreboard-strip stats from
 * `GET /api/home-stats` (new in this task). Public, unauthenticated, no
 * query params.
 */
export function getHomeStats(): Promise<HomeStatsResponse> {
  return apiFetch<HomeStatsResponse>('/api/home-stats')
}

export interface HomeStat {
  key: string
  value: string
}

export interface UpdateHomeStatResponse {
  stat: HomeStat
}

/**
 * Upserts a home-stat value via `PUT /staff/home-stats/:key` (Task 20,
 * `requireStaff`-protected). Same `400 validation_error` / `fields` shape as
 * {@link createChangelogEntry}.
 */
export function updateHomeStat(
  key: string,
  value: string,
): Promise<UpdateHomeStatResponse> {
  return apiFetch<UpdateHomeStatResponse>(
    `/staff/home-stats/${encodeURIComponent(key)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    },
  )
}

export type EntitlementKind = 'vip' | 'skin' | 'vehicle'
export type EntitlementDuration = 'days' | 'months' | 'years' | 'lifetime'

export interface GrantEntitlementInput {
  kind: EntitlementKind
  key: string
  durationUnit: EntitlementDuration
  quantity: number
}

export interface StaffPlayerLookup {
  id: string
  displayName: string
  discordUsername: string
  linkedToFiveM: boolean
}

export function searchStaffPlayers(search: string): Promise<{ players: StaffPlayerLookup[] }> {
  const params = new URLSearchParams({ search })
  return apiFetch<{ players: StaffPlayerLookup[] }>(`/staff/players?${params.toString()}`)
}

export interface GrantEntitlementResponse {
  entitlement: {
    id: string
    kind: EntitlementKind
    key: string
    durationUnit: EntitlementDuration
    grantedAt: string
    expiresAt: string | null
  }
}

/** Grants a timed or lifetime benefit through the admin-only Staff route. */
export function grantPlayerEntitlement(
  playerId: string,
  input: GrantEntitlementInput,
): Promise<GrantEntitlementResponse> {
  return apiFetch<GrantEntitlementResponse>(`/staff/players/${encodeURIComponent(playerId)}/entitlements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

/** Revokes an existing benefit through the admin-only Staff route. */
export function revokePlayerEntitlement(entitlementId: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/staff/entitlements/${encodeURIComponent(entitlementId)}`, {
    method: 'DELETE',
  })
}
