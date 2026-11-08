import { useEffect, useState } from 'react'
import {
  getStaffDashboardSummary, getStaffDirectoryPlayers, getStaffAudit, getStaffTeam, updateStaffRole, getServerStatus,
  type StaffDashboardSummary, type StaffDirectoryPlayer, type StaffAuditEntry, type StaffTeamMember, type StaffPermission, getStaffMemberPermissions, updateStaffMemberPermissions,
} from '../../lib/api'
import { buttonVariants } from '../../components/ui/variants'
import { cn } from '../../lib/cn'

const panel = 'staff-panel rounded-xl border border-line bg-panel p-5 sm:p-6'
const money = (cents:number) => (cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const date = (value:string) => new Date(value).toLocaleString('pt-BR')
function exportPlayersCsv(players:StaffDirectoryPlayer[]) {
 const columns=['ID','Nome','Discord','Discord ID','Licença FiveM','Vinculado','Partidas','Vitórias','Permissões ativas','Pedidos','Cadastro']
 const quote=(value:unknown)=>`"${String(value??'').replace(/"/g,'""')}"`
 const lines=[columns.map(quote).join(';'),...players.map(p=>[p.id,p.displayName,p.discordUsername,p.discordId,p.fivemLicense,p.linkedToFiveM?'sim':'não',p.matches,p.wins,p.activeEntitlements,p.ordersCount,p.createdAt].map(quote).join(';'))]
 const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'})
 const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='zkpvp-jogadores.csv';link.click();URL.revokeObjectURL(url)
}

export function StaffOverview() {
  const [summary,setSummary]=useState<StaffDashboardSummary|null>(null)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  const [reload,setReload]=useState(0)
  useEffect(()=>{let alive=true;setLoading(true);getStaffDashboardSummary().then(r=>{if(alive)setSummary(r.summary)}).catch(()=>{if(alive)setError('Não foi possível carregar os indicadores.')}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[reload])
  const metrics: Array<[string,string,string]> = summary ? [
    ['Jogadores cadastrados',String(summary.players),'users'],['Contas vinculadas',String(summary.linkedPlayers),'link'],
    ['Permissões ativas',String(summary.activeEntitlements),'shield'],['Pedidos registrados',String(summary.orders),'shopping'],
    ['Receita confirmada',money(summary.revenueCents),'revenue'],['Produtos ativos',String(summary.activeProducts),'store'],
    ['Próximos eventos',String(summary.upcomingEvents),'calendar'],['Equipe Staff',String(summary.staffMembers),'staff'],
  ] : []
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[.2em] text-accent">Visão operacional</p><h2 className="text-2xl text-ink">Resumo do ZKPVP</h2><p className="text-sm text-mute">Indicadores consultados diretamente no banco de dados.</p></div><button className={cn(buttonVariants({intent:'outline'}))} onClick={()=>setReload(x=>x+1)}>↻ Atualizar dados</button></div>
    {error&&<p role="alert" className="text-danger">{error}</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{loading?Array.from({length:8},(_,i)=><div key={i} className={`${panel} animate-pulse`}><div className="h-3 w-28 rounded bg-line"/><div className="mt-4 h-8 w-20 rounded bg-line"/></div>):metrics.map(([label,value])=><article key={label} className={panel}><p className="text-sm text-mute">{label}</p><strong className="mt-2 block text-3xl text-ink">{value}</strong></article>)}</div>
    <div className={panel}><h3 className="text-lg text-ink">Indicadores de acesso</h3><div className="mt-4 flex items-center justify-between text-sm"><span className="text-mute">Jogadores vinculados ao FiveM</span><strong className="text-ink">{loading||!summary?'—':`${summary.linkedPlayers} / ${summary.players}`}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent" style={{width:`${summary&&summary.players?Math.min(100,summary.linkedPlayers/summary.players*100):0}%`}}/></div><p className="mt-3 text-xs text-mute">A receita considera apenas pedidos pagos, em processamento ou entregues. Não inclui pedidos pendentes, cancelados ou reembolsados.</p></div>
  </section>
}

export function StaffPlayerDirectory() {
  const [players,setPlayers]=useState<StaffDirectoryPlayer[]>([]);const [search,setSearch]=useState('');const [query,setQuery]=useState('');const [loading,setLoading]=useState(true);const [error,setError]=useState('')
  useEffect(()=>{let alive=true;setLoading(true);setError('');getStaffDirectoryPlayers(query).then(r=>{if(alive)setPlayers(r.players)}).catch(()=>{if(alive)setError('Falha ao consultar jogadores.')}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[query])
  return <section className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><div className={panel}><small className="text-mute">Encontrados nesta consulta</small><strong className="mt-2 block text-2xl text-ink">{loading?'—':players.length}</strong></div><div className={panel}><small className="text-mute">Vinculados ao FiveM</small><strong className="mt-2 block text-2xl text-ink">{loading?'—':players.filter(p=>p.linkedToFiveM).length}</strong></div><div className={panel}><small className="text-mute">Com permissões ativas</small><strong className="mt-2 block text-2xl text-ink">{loading?'—':players.filter(p=>p.activeEntitlements>0).length}</strong></div></div>
    <div className={panel}><div><h2 className="text-2xl text-ink">Todos os jogadores</h2><p className="text-sm text-mute">Pesquise por nome, Discord, ID do Discord ou licença FiveM. Limite de 500 resultados por consulta.</p></div><form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={e=>{e.preventDefault();setQuery(search.trim())}}><input aria-label="Pesquisar jogadores" className="min-w-0 flex-1" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome, Discord, ID ou license…"/><button className={cn(buttonVariants())}>Pesquisar</button><button type="button" className={cn(buttonVariants({intent:'outline'}))} onClick={()=>{setSearch('');setQuery('')}}>Limpar</button><button type="button" className={cn(buttonVariants({intent:'outline'}))} onClick={()=>exportPlayersCsv(players)} disabled={!players.length}>Exportar CSV</button></form>
    {error&&<p role="alert" className="mt-4 text-danger">{error}</p>}{loading?<p className="py-10 text-center text-mute">Carregando jogadores…</p>:players.length===0?<p className="py-10 text-center text-mute">Nenhum jogador encontrado.</p>:<div className="mt-5 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase tracking-wider text-mute"><th className="p-3">Jogador</th><th className="p-3">Vínculo</th><th className="p-3">Partidas</th><th className="p-3">Vitórias</th><th className="p-3">Permissões</th><th className="p-3">Pedidos</th><th className="p-3">Cadastro</th></tr></thead><tbody>{players.map(p=><tr key={p.id} className="border-b border-line/70"><td className="p-3"><strong className="block text-ink">{p.displayName}</strong><span className="text-xs text-mute">@{p.discordUsername} · {p.discordId}</span><span className="block max-w-56 truncate text-[11px] text-mute">{p.fivemLicense??'Sem licença FiveM'}</span></td><td className="p-3">{p.linkedToFiveM?<span className="text-success">Vinculado</span>:<span className="text-danger">Pendente</span>}</td><td className="p-3">{p.matches}</td><td className="p-3">{p.wins}</td><td className="p-3">{p.activeEntitlements}</td><td className="p-3">{p.ordersCount}</td><td className="p-3 text-mute">{date(p.createdAt)}</td></tr>)}</tbody></table></div>}</div></section>
}

export function StaffAuditPanel() {
 const [entries,setEntries]=useState<StaffAuditEntry[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [reload,setReload]=useState(0)
 useEffect(()=>{let alive=true;setLoading(true);getStaffAudit(150).then(r=>{if(alive)setEntries(r.entries)}).catch(()=>{if(alive)setError('Não foi possível carregar a auditoria.')}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[reload])
 return <section className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl text-ink">Auditoria administrativa</h2><p className="text-sm text-mute">Registro de ações administrativas que já são gravadas pelo backend.</p></div><button className={cn(buttonVariants({intent:'outline'}))} onClick={()=>setReload(x=>x+1)}>↻ Atualizar</button></div>{error&&<p role="alert" className="mt-4 text-danger">{error}</p>}{loading?<p className="py-8 text-center text-mute">Carregando registros…</p>:entries.length===0?<p className="py-8 text-center text-mute">Ainda não existem registros de auditoria.</p>:<div className="mt-5 space-y-3">{entries.map(item=><article key={item.id} className="rounded-lg border border-line p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-ink">{item.action}</strong><time className="text-xs text-mute">{date(item.createdAt)}</time></div><p className="mt-1 text-sm text-mute">Por <strong className="text-ink">{item.staffUsername}</strong>{item.targetPlayerName?` · Jogador: ${item.targetPlayerName}`:''}</p><pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded bg-black/20 p-3 text-xs text-mute">{JSON.stringify(item.details,null,2)}</pre></article>)}</div>}</section>
}

export function StaffTeamPanel() {
 const [members,setMembers]=useState<StaffTeamMember[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [message,setMessage]=useState('');const [reload,setReload]=useState(0)
 useEffect(()=>{let alive=true;setLoading(true);getStaffTeam().then(r=>{if(alive)setMembers(r.members)}).catch(()=>{if(alive)setError('Não foi possível carregar a equipe.')}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[reload])
 async function changeRole(member:StaffTeamMember,role:StaffTeamMember['role']){if(role===member.role)return;if(!window.confirm(`Alterar ${member.username} para ${role}?`))return;setMessage('');try{await updateStaffRole(member.id,role);setMessage('Cargo atualizado e ação registrada na auditoria.');setReload(x=>x+1)}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível atualizar o cargo. Apenas administradores podem fazer isso.')}}
 const roleLabel={admin:'Administrador',moderator:'Moderador',attendant:'Atendente'}
 return <section className={panel}><div><h2 className="text-2xl text-ink">Equipe Staff</h2><p className="text-sm text-mute">Consulte os membros e gerencie os cargos. Alterações de cargo exigem uma sessão de administrador.</p></div>{error&&<p role="alert" className="mt-4 text-danger">{error}</p>}{message&&<p role="status" className="mt-4 text-sm text-accent">{message}</p>}{loading?<p className="py-8 text-center text-mute">Carregando equipe…</p>:<div className="mt-5 divide-y divide-line">{members.map(m=><div key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><strong className="block text-ink">{m.username}</strong><span className="text-xs text-mute">Desde {date(m.createdAt)}</span></div><label className="flex items-center gap-3 text-sm text-mute">Cargo<select aria-label={`Cargo de ${m.username}`} value={m.role} onChange={e=>changeRole(m,e.target.value as StaffTeamMember['role'])}><option value="admin">{roleLabel.admin}</option><option value="moderator">{roleLabel.moderator}</option><option value="attendant">{roleLabel.attendant}</option></select></label></div>)}</div>}</section>
}

export function StaffServerMonitor() {
  const [online,setOnline]=useState<number|null>(null);const [updated,setUpdated]=useState<string|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [reload,setReload]=useState(0)
  useEffect(()=>{let alive=true;setLoading(true);getServerStatus().then(r=>{if(alive){setOnline(r.online);setUpdated(r.lastUpdated)}}).catch(()=>{if(alive)setError('Não foi possível consultar o status do servidor.')}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[reload])
  return <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl text-ink">Monitoramento FiveM</h2><p className="text-sm text-mute">Dados fornecidos pela integração de status já existente na API.</p></div><button className={cn(buttonVariants({intent:'outline'}))} onClick={()=>setReload(x=>x+1)}>↻ Atualizar</button></div><div className={panel}><p className="text-sm text-mute">Jogadores online</p><strong className="mt-2 block text-5xl text-ink">{loading?'—':online===null?'Indisponível':online}</strong><p className="mt-3 text-sm text-mute">{updated?`Última atualização: ${date(updated)}`:'A API ainda não recebeu uma leitura válida do servidor.'}</p>{error&&<p role="alert" className="mt-3 text-danger">{error}</p>}</div><p className="text-xs text-mute">A disponibilidade online/offline, uptime, latência e histórico de quedas exigem telemetria adicional no servidor FiveM; este painel não inventa esses indicadores.</p></section>
}


const permissionCatalog: Array<[StaffPermission,string,string]> = [
 ['players.read','Consultar jogadores','Acessar diretório e fichas'],
 ['players.manage','Gerenciar jogadores','Adicionar anotações internas'],
 ['punishments.read','Consultar punições','Visualizar histórico'],
 ['punishments.manage','Gerenciar punições','Criar, revogar advertências e banimentos'],
 ['tickets.read','Consultar atendimento','Visualizar tickets e denúncias'],
 ['tickets.manage','Gerenciar atendimento','Criar e atualizar tickets'],
 ['store.read','Consultar loja','Visualizar catálogo'],
 ['store.manage','Gerenciar loja','Criar e editar produtos'],
 ['orders.read','Consultar financeiro','Visualizar pedidos e faturamento'],
 ['content.manage','Gerenciar conteúdo','Eventos, changelog e página inicial'],
 ['monitor.read','Monitorar servidor','Consultar status do FiveM'],
 ['audit.read','Consultar auditoria','Visualizar ações administrativas'],
 ['team.manage','Gerenciar equipe','Cargos e permissões'],
 ['notifications.manage','Publicar comunicados','Enviar alertas internos'],
]
export function StaffPermissionMatrix(){
 const [members,setMembers]=useState<StaffTeamMember[]>([])
 const [selected,setSelected]=useState('')
 const [permissions,setPermissions]=useState<StaffPermission[]>([])
 const [loading,setLoading]=useState(false)
 const [message,setMessage]=useState('')
 useEffect(()=>{getStaffTeam().then(r=>{setMembers(r.members);if(r.members[0])setSelected(r.members[0].id)}).catch(()=>setMessage('Não foi possível carregar a equipe.'))},[])
 useEffect(()=>{if(!selected)return;setLoading(true);getStaffMemberPermissions(selected).then(r=>setPermissions(r.permissions)).catch(()=>setMessage('Somente administradores podem consultar permissões.')).finally(()=>setLoading(false))},[selected])
 function toggle(permission:StaffPermission,checked:boolean){setPermissions(old=>checked?[...old,permission]:old.filter(p=>p!==permission))}
 async function save(){try{await updateStaffMemberPermissions(selected,permissions);setMessage('Matriz de permissões salva e auditada.')}catch{setMessage('Falha ao salvar. A operação exige permissão team.manage.')}}
 return <section className={`${panel} mt-5`}><h3 className="text-xl text-ink">Matriz granular de permissões</h3><p className="text-sm text-mute">Permissões explícitas concedidas a cada conta. Administradores mantêm acesso total; cargos também possuem permissões padrão.</p><label className="mt-4 block text-sm text-mute">Membro da equipe<select className="mt-1 w-full" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Selecione</option>{members.map(m=><option key={m.id} value={m.id}>{m.username} · {m.role}</option>)}</select></label><div className="mt-4 grid gap-2 sm:grid-cols-2">{permissionCatalog.map(([key,label,description])=><label key={key} className="flex items-start gap-3 rounded border border-line p-3"><input type="checkbox" checked={permissions.includes(key)} disabled={loading||!selected} onChange={e=>toggle(key,e.target.checked)}/><span><strong className="block text-sm text-ink">{label}</strong><small className="text-mute">{description}</small></span></label>)}</div><button className={cn(buttonVariants(),'mt-4')} disabled={!selected||loading} onClick={()=>void save()}>Salvar permissões</button>{message&&<p role="status" className="mt-3 text-sm text-accent">{message}</p>}</section>
}
