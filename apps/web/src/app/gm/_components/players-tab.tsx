'use client'

import { useState, useEffect, useCallback } from 'react'
import { clientFetch } from '@/lib/client-api'
import type { ApiCharacter } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

interface ApiUser {
  _id: string
  email: string
  username: string
  role: 'gm' | 'player'
  character_id: string | null
  createdAt: string
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UserRow({
  user,
  character,
  token,
  onImported,
}: {
  user: ApiUser
  character: ApiCharacter | null
  token: string
  onImported: (userId: string, char: ApiCharacter) => void
}) {
  const [open, setOpen] = useState(false)
  const [pbId, setPbId] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleImport() {
    const id = parseInt(pbId, 10)
    if (!id) return
    setImporting(true)
    setError(null)
    try {
      const char = await clientFetch<ApiCharacter>(
        '/characters/import/pathbuilder/for-user',
        token,
        { method: 'POST', body: JSON.stringify({ user_id: user._id, pathbuilder_id: id }) }
      )
      if (char) {
        onImported(user._id, char)
        setPbId('')
        setOpen(false)
      }
    } catch {
      setError('No se pudo importar. Verificá que el ID sea correcto y esté público.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#2a2826] bg-[#181412] px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3c3330] bg-[#0e0c0b] font-display text-[0.75rem] font-bold text-amber-500">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-[0.88rem] font-semibold tracking-[0.03em] text-stone-100">
                {user.username}
              </span>
              <span className={`rounded border px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] ${
                user.role === 'gm'
                  ? 'border-red-500/25 bg-red-500/8 text-red-400'
                  : 'border-[#3c3330] bg-[#0e0c0b] text-stone-600'
              }`}>
                {user.role}
              </span>
            </div>
            <div className="text-[0.68rem] text-stone-600">{user.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {character ? (
            <div className="text-right">
              <div className="font-display text-[0.82rem] font-semibold text-stone-300">{character.build.name}</div>
              <div className="text-[0.65rem] text-stone-600">
                {character.build.class} · Nv {character.build.level}
              </div>
            </div>
          ) : (
            <span className="text-[0.68rem] italic text-stone-700">Sin personaje</span>
          )}

          {user.role === 'player' && (
            <button
              onClick={() => setOpen(o => !o)}
              className="rounded-lg border border-[#3c3330] px-3 py-1.5 text-[0.72rem] text-stone-500 transition-colors hover:border-amber-500/30 hover:text-amber-400"
            >
              {character ? 'Reimportar' : 'Importar PJ'}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-4 border-t border-[#2a2826] pt-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={pbId}
              onChange={e => setPbId(e.target.value)}
              placeholder="ID de Pathbuilder 2e"
              className="flex-1 rounded-lg border border-[#3c3330] bg-[#0e0c0b] px-3 py-2 text-[0.8rem] text-stone-300 placeholder-stone-700 focus:border-amber-500/40 focus:outline-none"
            />
            <button
              onClick={handleImport}
              disabled={importing || !pbId}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[0.72rem] font-semibold text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-40"
            >
              {importing ? 'Importando…' : 'Importar'}
            </button>
          </div>
          {error && <p className="mt-2 text-[0.72rem] text-rose-400">{error}</p>}
          <p className="mt-2 text-[0.65rem] text-stone-700">
            El personaje debe estar marcado como público en Pathbuilder 2e.
          </p>
        </div>
      )}
    </div>
  )
}

function CreateUserForm({
  token,
  onCreated,
}: {
  token: string
  onCreated: (user: ApiUser) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ email: '', username: '', password: '', role: 'player' as 'gm' | 'player' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)

  async function handleCreate() {
    if (!form.email || !form.username || !form.password) return
    setCreating(true)
    setError(null)
    try {
      // Register is public — no token needed, but we pass role
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? 'Error al crear usuario')
      }
      // Fetch the newly created user from the users list
      const users = await clientFetch<ApiUser[]>('/users', token)
      const newUser = users?.find(u => u.email === form.email.toLowerCase())
      if (newUser) {
        onCreated(newUser)
        setCreated({ email: form.email, password: form.password })
        setForm({ email: '', username: '', password: '', role: 'player' })
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCreating(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#3c3330] py-4 text-[0.78rem] text-stone-600 transition-colors hover:border-amber-500/30 hover:text-amber-400"
      >
        + Crear usuario
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-amber-500/15 bg-[#181412] px-5 py-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-display text-[0.8rem] font-semibold tracking-[0.06em] text-stone-300">
          Nuevo usuario
        </span>
        <button onClick={() => { setOpen(false); setCreated(null) }} className="text-[0.7rem] text-stone-600 hover:text-stone-400">
          ✕
        </button>
      </div>

      {created ? (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
          <div className="mb-1 text-[0.72rem] font-semibold text-emerald-400">Usuario creado</div>
          <div className="font-mono text-[0.72rem] text-stone-400">
            <div>Email: <span className="text-stone-200">{created.email}</span></div>
            <div>Contraseña: <span className="text-stone-200">{created.password}</span></div>
          </div>
          <p className="mt-2 text-[0.65rem] text-stone-600">Compartí estas credenciales con el jugador.</p>
          <button
            onClick={() => { setCreated(null); setOpen(false) }}
            className="mt-3 rounded-lg border border-[#3c3330] px-3 py-1.5 text-[0.7rem] text-stone-500 hover:text-stone-300"
          >
            Listo
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              type="email"
              className="rounded-lg border border-[#3c3330] bg-[#0e0c0b] px-3 py-2 text-[0.8rem] text-stone-300 placeholder-stone-700 focus:border-amber-500/40 focus:outline-none"
            />
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="Username"
              className="rounded-lg border border-[#3c3330] bg-[#0e0c0b] px-3 py-2 text-[0.8rem] text-stone-300 placeholder-stone-700 focus:border-amber-500/40 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Contraseña (min. 8 chars)"
              type="text"
              className="rounded-lg border border-[#3c3330] bg-[#0e0c0b] px-3 py-2 text-[0.8rem] text-stone-300 placeholder-stone-700 focus:border-amber-500/40 focus:outline-none"
            />
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as 'gm' | 'player' }))}
              className="rounded-lg border border-[#3c3330] bg-[#0e0c0b] px-3 py-2 text-[0.8rem] text-stone-300 focus:border-amber-500/40 focus:outline-none"
            >
              <option value="player">Player</option>
              <option value="gm">GM</option>
            </select>
          </div>
          {error && <p className="text-[0.72rem] text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-[#3c3330] px-3 py-2 text-[0.72rem] text-stone-600 hover:text-stone-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.email || !form.username || form.password.length < 8}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[0.72rem] font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-40"
            >
              {creating ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export function PlayersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [characters, setCharacters] = useState<ApiCharacter[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [us, chars] = await Promise.all([
        clientFetch<ApiUser[]>('/users', token),
        fetch(`${API_URL}/characters`).then(r => r.json()) as Promise<ApiCharacter[]>,
      ])
      setUsers(Array.isArray(us) ? us : [])
      setCharacters(Array.isArray(chars) ? chars : [])
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  function handleCreated(user: ApiUser) {
    setUsers(prev => [...prev, user])
  }

  function handleImported(userId: string, char: ApiCharacter) {
    setCharacters(prev => {
      const without = prev.filter(c => c._id !== char._id)
      return [...without, char]
    })
    setUsers(prev =>
      prev.map(u => u._id === userId ? { ...u, character_id: char._id } : u)
    )
  }

  function charForUser(user: ApiUser): ApiCharacter | null {
    if (!user.character_id) return null
    return characters.find(c => c._id === user.character_id) ?? null
  }

  const players = users.filter(u => u.role === 'player')
  const gms     = users.filter(u => u.role === 'gm')

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 flex flex-wrap gap-6">
        {[
          { val: players.length, lbl: 'Jugadores', color: 'text-stone-200' },
          { val: players.filter(u => u.character_id).length, lbl: 'Con personaje', color: 'text-emerald-400' },
          { val: players.filter(u => !u.character_id).length, lbl: 'Sin personaje', color: players.some(u => !u.character_id) ? 'text-amber-400' : 'text-stone-600' },
        ].map(({ val, lbl, color }) => (
          <div key={lbl} className="flex items-baseline gap-1.5">
            <span className={`font-display text-[1.5rem] font-bold leading-none ${color}`}>{val}</span>
            <span className="text-[0.62rem] uppercase tracking-[0.12em] text-stone-600">{lbl}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[#181412]" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <CreateUserForm token={token} onCreated={handleCreated} />

          {players.length > 0 && (
            <>
              <div className="mt-2 mb-1 text-[0.62rem] uppercase tracking-[0.18em] text-stone-700">
                Jugadores
              </div>
              {players.map(user => (
                <UserRow
                  key={user._id}
                  user={user}
                  character={charForUser(user)}
                  token={token}
                  onImported={handleImported}
                />
              ))}
            </>
          )}

          {gms.length > 0 && (
            <>
              <div className="mt-4 mb-1 text-[0.62rem] uppercase tracking-[0.18em] text-stone-700">
                Game Masters
              </div>
              {gms.map(user => (
                <UserRow
                  key={user._id}
                  user={user}
                  character={charForUser(user)}
                  token={token}
                  onImported={handleImported}
                />
              ))}
            </>
          )}

          {users.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#3c3330] py-12 text-center">
              <div className="mb-2 text-3xl opacity-20">👤</div>
              <div className="font-display text-[0.85rem] font-semibold tracking-[0.08em] text-stone-600">
                Sin usuarios registrados
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
