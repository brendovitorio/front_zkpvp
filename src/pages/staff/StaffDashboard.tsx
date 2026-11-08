import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { StaffOverview, StaffPlayerDirectory, StaffAuditPanel, StaffTeamPanel, StaffServerMonitor, StaffPermissionMatrix } from './StaffOperations'
import { StaffPlayerProfiles, StaffPunishmentsPanel, StaffTicketsPanel, StaffOrdersPanel, StaffNotificationsPanel } from './StaffAdvanced'
import {
  buttonVariants,
  labelClass,
  pageShellClass,
  successClass,
} from '../../components/ui/variants'
import { cn } from '../../lib/cn'
import {
  ApiError,
  createChangelogEntry,
  createEvent,
  createStaffStoreItem,
  deactivateStaffStoreItem,
  getStaffStoreItems,
  getAuthorizedPlayers,
  type AuthorizedPlayer,
  updateStaffStoreItem,
  grantPlayerEntitlement,
  revokePlayerEntitlement,
  searchStaffPlayers,
  type StaffPlayerLookup,
  type StoreItem,
  type SaveStoreItemInput,
  updateHomeStat,
} from '../../lib/api'

/**
 * Shape of a `400 { error: "validation_error", fields: {...} }` response
 * from any `requireStaff` route (Task 20). Keyed by field name (dotted path
 * for nested fields, though none of this page's forms are nested), value is
 * the first Zod issue message for that field in Portuguese (e.g.
 * `"obrigatório"`).
 */
type FieldErrors = Record<string, string>

/**
 * Reads the `fields` map off an `ApiError` whose body is a `400
 * validation_error` response; returns `{}` for anything else (network
 * failure, 401, 404, a malformed body) so callers can always spread the
 * result into field-error state without a null check.
 */
function fieldErrorsFrom(error: unknown): FieldErrors {
  if (
    error instanceof ApiError &&
    error.status === 400 &&
    error.body &&
    typeof error.body === 'object' &&
    'fields' in error.body
  ) {
    const { fields } = error.body as { fields: unknown }
    if (fields && typeof fields === 'object') {
      return fields as FieldErrors
    }
  }
  return {}
}

/** Renders a field's validation message right under its input, if any. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="staff-dashboard__field-error mt-1.5 text-sm text-danger">{message}</p>
}

/**
 * StaffDashboard page (`/staff`): three independent forms, each hitting its
 * own `requireStaff`-protected endpoint (Task 20) —
 *
 *   - "Novo item de changelog" -> `POST /staff/changelog`
 *   - "Novo evento" -> `POST /staff/events`
 *   - "Editar estatística da home" -> `PUT /staff/home-stats/:key`
 *
 * Each form keeps its own field values, submit status, and `FieldErrors`
 * state. On a `400 validation_error`, the server's `fields` map is rendered
 * inline next to the matching input via `FieldError` above — not a generic
 * toast/banner — because the brief's test asserts the message text itself
 * (e.g. "obrigatório") appears in the document, which only a field-level
 * render satisfies for an arbitrary field name.
 *
 * This page does NOT use `useAuth()`/`AuthContext` (player-only, Task 15):
 * staff auth uses its own cookie and is checked by `StaffGuard` before this
 * dashboard renders. The API still independently protects every operation
 * with `requireStaff`.
 */
type StaffSection = 'overview' | 'directory' | 'profiles' | 'players' | 'access' | 'punishments' | 'tickets' | 'store' | 'orders' | 'content' | 'audit' | 'team' | 'monitor' | 'notifications'

export function StaffDashboard() {
  const [section, setSection] = useState<StaffSection>('overview')
  const tabs: { id: StaffSection; label: string; detail: string }[] = [
    { id: 'overview', label: 'Visão geral', detail: 'Indicadores e resumo' },
    { id: 'directory', label: 'Todos os jogadores', detail: 'Diretório e perfis' },
    { id: 'profiles', label: 'Ficha do jogador', detail: 'Histórico e anotações' },
    { id: 'players', label: 'Jogadores liberados', detail: 'Permissões ativas' },
    { id: 'access', label: 'Acessos', detail: 'Conceder e revogar' },
    { id: 'punishments', label: 'Punições', detail: 'Advertências e banimentos' },
    { id: 'tickets', label: 'Atendimento', detail: 'Tickets e denúncias' },
    { id: 'store', label: 'Loja', detail: 'Produtos e estoque' },
    { id: 'orders', label: 'Financeiro', detail: 'Pedidos e faturamento' },
    { id: 'content', label: 'Conteúdo', detail: 'Eventos e atualizações' },
    { id: 'monitor', label: 'Monitoramento', detail: 'Status do FiveM' },
    { id: 'audit', label: 'Auditoria', detail: 'Histórico administrativo' },
    { id: 'team', label: 'Equipe Staff', detail: 'Cargos e hierarquia' },
    { id: 'notifications', label: 'Comunicados', detail: 'Alertas internos' },
  ]
  return (
    <section className={cn('staff-dashboard-page pb-20', pageShellClass)}>
      <PageHeader title="Central da" titleAccent="equipe" lede="Gerencie jogadores, permissões, loja e conteúdo em áreas separadas." />
      <div className="staff-console mb-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[.22em] text-accent">ZKPVP · STAFF CONTROL</p><h2 className="mt-1 text-2xl text-ink">Central de operações</h2></div>
          <span className="rounded-full border border-accent/30 px-3 py-1 text-xs text-accent">Sessão autenticada</span>
        </div>
        <nav className="staff-tabs" aria-label="Seções do painel Staff">
          {tabs.map(tab => <button key={tab.id} type="button" onClick={() => setSection(tab.id)} className={cn('staff-tab', section === tab.id && 'staff-tab--active')} aria-current={section === tab.id ? 'page' : undefined}>
            <span>{tab.label}</span><small>{tab.detail}</small>
          </button>)}
        </nav>
      </div>
      {section === 'overview' && <div className="space-y-6"><StaffOverview /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tabs.filter(tab => tab.id !== 'overview').map(tab => <button key={tab.id} type="button" onClick={() => setSection(tab.id)} className="staff-shortcut text-left"><span className="text-xs font-bold uppercase tracking-widest text-accent">Acessar seção</span><strong className="mt-2 block text-xl text-ink">{tab.label}</strong><span className="mt-1 block text-sm text-mute">{tab.detail}</span><span className="mt-5 block text-sm text-accent">Abrir painel →</span></button>)}</div></div>}
      {section === 'directory' && <StaffPlayerDirectory />}
      {section === 'profiles' && <StaffPlayerProfiles />}
      {section === 'players' && <AuthorizedPlayers />}
      {section === 'monitor' && <StaffServerMonitor />}
      {section === 'audit' && <StaffAuditPanel />}
      {section === 'team' && <><StaffTeamPanel /><StaffPermissionMatrix /></>}
      {section === 'punishments' && <StaffPunishmentsPanel />}
      {section === 'tickets' && <StaffTicketsPanel />}
      {section === 'orders' && <StaffOrdersPanel />}
      {section === 'notifications' && <StaffNotificationsPanel />}
      {section === 'access' && <div className="grid items-start gap-6 xl:grid-cols-2"><EntitlementForm /><RevokeEntitlementForm /></div>}
      {section === 'store' && <StoreProductsForm />}
      {section === 'content' && <div className="grid items-start gap-6 xl:grid-cols-2"><ChangelogForm /><div className="flex flex-col gap-6"><EventForm /><HomeStatForm /></div></div>}
    </section>
  )
}

function AuthorizedPlayers() {
  const [players, setPlayers] = useState<AuthorizedPlayer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    getAuthorizedPlayers().then(({ players: rows }) => { if (active) setPlayers(rows) })
      .catch(() => { if (active) setError('Não foi possível carregar os jogadores liberados. Verifique sua sessão e tente novamente.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refreshKey])
  const filtered = useMemo(() => players.filter(p => `${p.displayName} ${p.discordUsername} ${p.entitlement.key} ${p.entitlement.kind}`.toLowerCase().includes(search.toLowerCase())), [players, search])
  const uniquePlayers = new Set(players.map(p => p.playerId)).size
  return <section className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="staff-metric"><small>Jogadores liberados</small><strong>{loading ? '—' : uniquePlayers}</strong></div>
      <div className="staff-metric"><small>Permissões ativas</small><strong>{loading ? '—' : players.length}</strong></div>
      <div className="staff-metric"><small>Vitalícias</small><strong>{loading ? '—' : players.filter(p => !p.entitlement.expiresAt).length}</strong></div>
    </div>
    <div className="staff-panel">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl text-ink">Jogadores liberados</h2><p className="text-sm text-mute">Lista atualizada dos jogadores com permissões válidas no servidor.</p></div><button type="button" className={cn(buttonVariants({ intent: 'outline' }))} onClick={() => setRefreshKey(v => v + 1)} disabled={loading}>↻ Atualizar</button></div>
      <div className="mt-5"><label className={labelClass} htmlFor="authorized-search">Filtrar jogadores ou permissões</label><input id="authorized-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, Discord, VIP, veículo…" /></div>
      {error && <p role="alert" className="mt-4 text-danger">{error}</p>}
      {loading ? <p className="py-10 text-center text-mute">Carregando jogadores…</p> : filtered.length === 0 ? <p className="py-10 text-center text-mute">{players.length ? 'Nenhum resultado para esse filtro.' : 'Nenhum jogador possui permissões ativas.'}</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-line text-xs uppercase tracking-wider text-mute"><th className="p-3">Jogador</th><th className="p-3">Permissão</th><th className="p-3">Validade</th><th className="p-3">FiveM</th></tr></thead><tbody>{filtered.map(row => <tr key={row.entitlement.id} className="border-b border-line/70"><td className="p-3"><strong className="block text-ink">{row.displayName}</strong><span className="text-xs text-mute">@{row.discordUsername}</span></td><td className="p-3"><span className="rounded-full border border-accent/30 px-2 py-1 text-xs text-accent">{row.entitlement.kind.toUpperCase()} · {row.entitlement.key}</span></td><td className="p-3 text-sm text-mute">{row.entitlement.expiresAt ? new Date(row.entitlement.expiresAt).toLocaleString('pt-BR') : 'Vitalício'}</td><td className="p-3 text-sm">{row.linkedToFiveM ? <span className="text-success">Vinculado</span> : <span className="text-danger">Não vinculado</span>}</td></tr>)}</tbody></table></div>}
    </div>
  </section>
}

function StoreProductsForm() {
  const [items, setItems] = useState<StoreItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('VIP')
  const [itemKey, setItemKey] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [stock, setStock] = useState('')
  const [active, setActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  function refresh() {
    getStaffStoreItems().then(({ items: rows }) => setItems(rows))
      .catch(() => { setError(true); setMessage('Não foi possível carregar os produtos. Verifique a sessão Staff e a API.') })
  }
  useEffect(() => { refresh() }, [])

  function reset() {
    setEditingId(null); setName(''); setDescription(''); setPrice(''); setCategory('VIP'); setItemKey('')
    setImageUrl(''); setStock(''); setActive(true)
  }
  function edit(item: StoreItem) {
    setEditingId(item.id); setName(item.name); setDescription(item.description)
    setPrice((item.priceCents / 100).toFixed(2).replace('.', ',')); setCategory(item.category); setItemKey(item.itemKey ?? '')
    setImageUrl(item.imageUrl ?? ''); setStock(item.stockQuantity === null ? '' : String(item.stockQuantity)); setActive(item.active)
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(false); setMessage('')
    const numericPrice = Number(price.replace(',', '.'))
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setBusy(false); setError(true); setMessage('Informe um preço válido maior que zero.'); return
    }
    const input: SaveStoreItemInput = {
      name: name.trim(), description: description.trim(), priceCents: Math.round(numericPrice * 100),
      category: category.trim(), itemKey: itemKey.trim() || null, imageUrl: imageUrl.trim() || null,
      stockQuantity: stock.trim() === '' ? null : Number(stock), active,
    }
    try {
      if (editingId) await updateStaffStoreItem(editingId, input)
      else await createStaffStoreItem(input)
      setMessage(editingId ? 'Produto atualizado.' : 'Produto cadastrado na loja.')
      reset(); refresh()
    } catch (e) {
      setError(true); setMessage(e instanceof ApiError && e.status === 400 ? 'Confira os campos: nome, preço, categoria, URL da imagem e estoque.' : 'Não foi possível salvar o produto. Verifique sua sessão Staff.')
    } finally { setBusy(false) }
  }
  async function deactivate(id: string) {
    if (!window.confirm('Desativar este produto da loja?')) return
    try { await deactivateStaffStoreItem(id); setMessage('Produto desativado.'); refresh() }
    catch { setError(true); setMessage('Não foi possível desativar o produto.') }
  }

  return <section className={`${formClass} mb-6`}>
    <div><h2 className="text-3xl text-ink">Produtos da loja</h2><p className="text-mute">Cadastre produtos com preço em reais, imagem, categoria e controle opcional de estoque.</p></div>
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <div><label className={labelClass} htmlFor="store-name">Nome do produto</label><input id="store-name" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={120}/></div>
      <div><label className={labelClass} htmlFor="store-price">Preço (R$)</label><input id="store-price" value={price} onChange={e => setPrice(e.target.value)} placeholder="29,90" required inputMode="decimal"/></div>
      <div><label className={labelClass} htmlFor="store-category">Categoria / tipo do item</label><input id="store-category" value={category} onChange={e => setCategory(e.target.value)} required/></div>
      <div><label className={labelClass} htmlFor="store-item-key">Item / código no servidor</label><input id="store-item-key" value={itemKey} onChange={e => setItemKey(e.target.value)} placeholder="ex.: vip_gold"/></div>
      <div><label className={labelClass} htmlFor="store-image">URL da imagem</label><input id="store-image" type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."/></div>
      <div><label className={labelClass} htmlFor="store-stock">Estoque (vazio = ilimitado)</label><input id="store-stock" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)}/></div>
      <div className="flex items-center gap-2 pt-7"><input id="store-active" type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}/><label htmlFor="store-active" className={labelClass}>Produto ativo na loja</label></div>
      <div className="md:col-span-2"><label className={labelClass} htmlFor="store-description">Descrição / detalhes do item</label><textarea id="store-description" value={description} onChange={e => setDescription(e.target.value)} rows={3}/></div>
      <div className="flex flex-wrap gap-2 md:col-span-2"><button className={cn(buttonVariants())} disabled={busy}>{busy ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Cadastrar produto'}</button>{editingId && <button type="button" className={cn(buttonVariants({ intent: 'outline' }))} onClick={reset}>Cancelar edição</button>}</div>
    </form>
    {message && <p role="status" className={error ? 'text-danger' : successClass}>{message}</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <article key={item.id} className="rounded border border-line p-4">
      <div className="flex gap-3">{item.imageUrl && <img src={item.imageUrl} alt="" className="h-16 w-16 rounded object-cover"/>}<div className="min-w-0"><strong className="block text-ink">{item.name}</strong><span className="text-sm text-mute">{item.category}{item.itemKey ? ` · ${item.itemKey}` : ''} · {(item.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span><span className="block text-xs text-mute">{item.active ? 'Ativo' : 'Inativo'} · {item.stockQuantity === null ? 'Estoque ilimitado' : `${item.stockQuantity} em estoque`}</span></div></div>
      <div className="mt-3 flex gap-2"><button type="button" className={cn(buttonVariants({ intent: 'outline', size: 'sm' }))} onClick={() => edit(item)}>Editar</button>{item.active && <button type="button" className={cn(buttonVariants({ intent: 'ghost', size: 'sm' }))} onClick={() => deactivate(item.id)}>Desativar</button>}</div>
    </article>)}</div>
    {items.length === 0 && <p className="text-sm text-mute">Nenhum produto cadastrado ainda.</p>}
  </section>
}

function EntitlementForm() {
  const [playerId, setPlayerId] = useState('')
  const [playerSearch, setPlayerSearch] = useState('')
  const [playerResults, setPlayerResults] = useState<StaffPlayerLookup[]>([])
  const [searchingPlayers, setSearchingPlayers] = useState(false)
  const [hasSearchedPlayers, setHasSearchedPlayers] = useState(false)
  const [kind, setKind] = useState<'vip' | 'skin' | 'vehicle'>('vip')
  const [key, setKey] = useState('vipZK')
  const [durationUnit, setDurationUnit] = useState<'days' | 'months' | 'years' | 'lifetime'>('days')
  const [quantity, setQuantity] = useState('30')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  function handlePlayerSearch() {
    setSearchingPlayers(true)
    setHasSearchedPlayers(true)
    setPlayerResults([])
    searchStaffPlayers(playerSearch.trim())
      .then(({ players }) => setPlayerResults(players))
      .catch(() => setMessage('Não foi possível buscar jogadores. Entre no painel Staff e tente novamente.'))
      .finally(() => setSearchingPlayers(false))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setSuccess(false)
    grantPlayerEntitlement(playerId.trim(), {
      kind,
      key: key.trim(),
      durationUnit,
      quantity: durationUnit === 'lifetime' ? 1 : Number(quantity),
    })
      .then(({ entitlement }) => {
        setSuccess(true)
        setMessage(`Acesso ${entitlement.kind}:${entitlement.key} concedido. ID: ${entitlement.id}`)
      })
      .catch((error) => {
        const code = error instanceof ApiError && error.body && typeof error.body === 'object' && 'error' in error.body
          ? String((error.body as { error: unknown }).error)
          : ''
        setMessage(code === 'player_not_linked_to_fivem'
          ? 'A conta ainda não foi vinculada a um jogador FiveM.'
          : code === 'player_not_found'
            ? 'Jogador não encontrado; confira o UUID da conta.'
              : code === 'forbidden'
              ? 'Somente uma conta Staff com papel admin pode conceder acessos.'
              : 'Não foi possível conceder o acesso. Confira os dados e a sessão Staff.')
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Conceder acesso" className={formClass}>
      <h2 className="text-3xl text-ink">Conceder acesso</h2>
      <p className="text-mute">Busque pelo nome do jogador ou Discord. A conta precisa estar vinculada ao FiveM. Concessões são exclusivas para Staff admin.</p>
      <div>
        <label htmlFor="entitlement-player-search" className={labelClass}>Buscar jogador</label>
        <div className="flex gap-2">
          <input id="entitlement-player-search" value={playerSearch} onChange={(event) => { setPlayerSearch(event.target.value); setHasSearchedPlayers(false); setPlayerResults([]) }} minLength={2} />
          <button type="button" className={cn(buttonVariants({ intent: 'outline' }))} onClick={handlePlayerSearch} disabled={searchingPlayers || playerSearch.trim().length < 2}>
            {searchingPlayers ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
        {playerResults.length > 0 && <ul className="mt-3 flex flex-col gap-2" aria-label="Resultados de jogadores">
          {playerResults.map((player) => <li key={player.id}>
            <button type="button" onClick={() => { setPlayerId(player.id); setPlayerResults([]) }} className="w-full rounded border border-line p-3 text-left text-ink hover:border-accent">
              <span className="block">{player.displayName} · {player.discordUsername}</span>
              <span className="block text-sm text-mute">{player.linkedToFiveM ? 'FiveM vinculado' : 'FiveM não vinculado'} · {player.id}</span>
            </button>
          </li>)}
        </ul>}
        {hasSearchedPlayers && !searchingPlayers && playerResults.length === 0 && <p className="mt-2 text-sm text-mute">Nenhum jogador encontrado. Confira a busca.</p>}
      </div>
      <div>
        <label htmlFor="entitlement-player-id" className={labelClass}>UUID do jogador</label>
        <input id="entitlement-player-id" value={playerId} onChange={(event) => setPlayerId(event.target.value)} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="entitlement-kind" className={labelClass}>Tipo de acesso</label>
          <select id="entitlement-kind" value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
            <option value="vip">VIP</option><option value="skin">Skin / roupa</option><option value="vehicle">Veículo</option>
          </select>
        </div>
        <div>
          <label htmlFor="entitlement-key" className={labelClass}>Chave no servidor</label>
          <input id="entitlement-key" value={key} onChange={(event) => setKey(event.target.value)} required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="entitlement-duration" className={labelClass}>Duração</label>
          <select id="entitlement-duration" value={durationUnit} onChange={(event) => setDurationUnit(event.target.value as typeof durationUnit)}>
            <option value="days">Dias</option><option value="months">Meses</option><option value="years">Anos</option><option value="lifetime">Vitalício</option>
          </select>
        </div>
        {durationUnit !== 'lifetime' && <div>
          <label htmlFor="entitlement-quantity" className={labelClass}>Quantidade</label>
          <input id="entitlement-quantity" type="number" min="1" max="1000" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </div>}
      </div>
      <button type="submit" className={cn(buttonVariants(), 'self-start')} disabled={submitting}>
        {submitting ? 'Concedendo…' : 'Conceder acesso'}
      </button>
      {message && <p role="status" className={success ? successClass : 'text-danger'}>{message}</p>}
    </form>
  )
}

function RevokeEntitlementForm() {
  const [entitlementId, setEntitlementId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setSuccess(false)
    revokePlayerEntitlement(entitlementId.trim())
      .then(() => { setSuccess(true); setMessage('Acesso revogado e registrado na auditoria.') })
      .catch((error) => {
        const code = error instanceof ApiError && error.body && typeof error.body === 'object' && 'error' in error.body
          ? String((error.body as { error: unknown }).error)
          : ''
        setMessage(code === 'entitlement_not_found'
          ? 'Concessão não encontrada ou já revogada.'
          : code === 'forbidden'
            ? 'Somente uma conta Staff com papel admin pode revogar acessos.'
            : 'Não foi possível revogar. Confira o ID e a sessão Staff.')
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Revogar acesso" className={formClass}>
      <h2 className="text-3xl text-ink">Revogar acesso</h2>
      <p className="text-mute">Informe o ID da concessão exibido ao conceder. A revogação é imediata na próxima sincronização do servidor.</p>
      <div>
        <label htmlFor="entitlement-revoke-id" className={labelClass}>ID da concessão</label>
        <input id="entitlement-revoke-id" value={entitlementId} onChange={(event) => setEntitlementId(event.target.value)} required />
      </div>
      <button type="submit" className={cn(buttonVariants(), 'self-start')} disabled={submitting}>
        {submitting ? 'Revogando…' : 'Revogar acesso'}
      </button>
      {message && <p role="status" className={success ? successClass : 'text-danger'}>{message}</p>}
    </form>
  )
}

/** Shared look for all three staff forms: chamfered panel, stacked fields. */
const formClass = 'staff-dashboard__form frame chamfer-lg flex flex-col gap-5 p-6 sm:p-8'

function ChangelogForm() {
  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [categories, setCategories] = useState('')
  const [body, setBody] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    setSuccess(false)

    createChangelogEntry({
      version,
      title,
      publishedAt,
      categories: categories
        .split(',')
        .map((category) => category.trim())
        .filter((category) => category.length > 0),
      body,
    })
      .then(() => {
        setSuccess(true)
      })
      .catch((error) => {
        setFieldErrors(fieldErrorsFrom(error))
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Novo item de changelog"
      className={formClass}
    >
      <h2 className="text-3xl text-ink">Novo item de changelog</h2>

      <div>
        <label htmlFor="changelog-version" className={labelClass}>Versão</label>
        <input
          id="changelog-version"
          value={version}
          onChange={(event) => setVersion(event.target.value)}
        />
        <FieldError message={fieldErrors.version} />
      </div>

      <div>
        <label htmlFor="changelog-title" className={labelClass}>Título</label>
        <input
          id="changelog-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <FieldError message={fieldErrors.title} />
      </div>

      <div>
        <label htmlFor="changelog-published-at" className={labelClass}>Data de publicação</label>
        <input
          id="changelog-published-at"
          type="date"
          value={publishedAt}
          onChange={(event) => setPublishedAt(event.target.value)}
        />
        <FieldError message={fieldErrors.publishedAt} />
      </div>

      <div>
        <label htmlFor="changelog-categories" className={labelClass}>
          Categorias (separadas por vírgula)
        </label>
        <input
          id="changelog-categories"
          value={categories}
          onChange={(event) => setCategories(event.target.value)}
        />
        <FieldError message={fieldErrors.categories} />
      </div>

      <div>
        <label htmlFor="changelog-body" className={labelClass}>Texto</label>
        <textarea
          id="changelog-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <FieldError message={fieldErrors.body} />
      </div>

      <button type="submit" className={cn(buttonVariants(), 'self-start')} disabled={submitting}>
        Salvar changelog
      </button>

      {success && <p role="status" className={successClass}>
          Changelog salvo!
        </p>}
    </form>
  )
}

function EventForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [prizeText, setPrizeText] = useState('')
  const [featured, setFeatured] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    setSuccess(false)

    createEvent({
      title,
      description,
      category,
      startsAt,
      prizeText: prizeText.trim().length > 0 ? prizeText : null,
      featured,
    })
      .then(() => {
        setSuccess(true)
      })
      .catch((error) => {
        setFieldErrors(fieldErrorsFrom(error))
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Novo evento"
      className={formClass}
    >
      <h2 className="text-3xl text-ink">Novo evento</h2>

      <div>
        <label htmlFor="event-title" className={labelClass}>Título</label>
        <input
          id="event-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <FieldError message={fieldErrors.title} />
      </div>

      <div>
        <label htmlFor="event-description" className={labelClass}>Descrição</label>
        <textarea
          id="event-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <FieldError message={fieldErrors.description} />
      </div>

      <div>
        <label htmlFor="event-category" className={labelClass}>Categoria</label>
        <input
          id="event-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
        <FieldError message={fieldErrors.category} />
      </div>

      <div>
        <label htmlFor="event-starts-at" className={labelClass}>Início</label>
        <input
          id="event-starts-at"
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
        />
        <FieldError message={fieldErrors.startsAt} />
      </div>

      <div>
        <label htmlFor="event-prize-text" className={labelClass}>Premiação</label>
        <input
          id="event-prize-text"
          value={prizeText}
          onChange={(event) => setPrizeText(event.target.value)}
        />
        <FieldError message={fieldErrors.prizeText} />
      </div>

      <div>
        <label htmlFor="event-featured" className="flex cursor-pointer items-center gap-3 text-ink">
          <input
            id="event-featured"
            type="checkbox"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
          />
          Destacar na home
        </label>
        <FieldError message={fieldErrors.featured} />
      </div>

      <button type="submit" className={cn(buttonVariants(), 'self-start')} disabled={submitting}>
        Salvar evento
      </button>

      {success && <p role="status" className={successClass}>
          Evento salvo!
        </p>}
    </form>
  )
}

function HomeStatForm() {
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    setSuccess(false)

    updateHomeStat(key, value)
      .then(() => {
        setSuccess(true)
      })
      .catch((error) => {
        setFieldErrors(fieldErrorsFrom(error))
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Editar estatística da home"
      className={formClass}
    >
      <h2 className="text-3xl text-ink">Editar estatística da home</h2>

      <div>
        <label htmlFor="home-stat-key" className={labelClass}>Chave</label>
        <input
          id="home-stat-key"
          value={key}
          onChange={(event) => setKey(event.target.value)}
        />
        <FieldError message={fieldErrors.key} />
      </div>

      <div>
        <label htmlFor="home-stat-value" className={labelClass}>Valor</label>
        <input
          id="home-stat-value"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <FieldError message={fieldErrors.value} />
      </div>

      <button type="submit" className={cn(buttonVariants(), 'self-start')} disabled={submitting}>
        Salvar estatística
      </button>

      {success && <p role="status" className={successClass}>
          Estatística salva!
        </p>}
    </form>
  )
}
