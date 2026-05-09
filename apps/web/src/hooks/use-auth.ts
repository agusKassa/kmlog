'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface JwtPayload {
  sub: string
  email: string
  role: 'gm' | 'player'
  exp: number
}

interface AuthState {
  user: JwtPayload | null
  token: string | null
  loading: boolean
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1]
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

function readAuth(): AuthState {
  const token = localStorage.getItem('access_token')
  if (!token) return { user: null, token: null, loading: false }
  const payload = decodeJwt(token)
  if (!payload || payload.exp * 1000 <= Date.now()) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    return { user: null, token: null, loading: false }
  }
  return { user: payload, token, loading: false }
}

export function useAuth(): AuthState & { isGm: boolean; isAuthenticated: boolean; username: string } {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true })
  const pathname = usePathname()

  useEffect(() => {
    setState(readAuth())
  }, [pathname])

  // Also re-read when auth-changed event fires (dispatched by login/logout)
  useEffect(() => {
    function onAuthChanged() { setState(readAuth()) }
    window.addEventListener('auth-changed', onAuthChanged)
    return () => window.removeEventListener('auth-changed', onAuthChanged)
  }, [])

  const username = state.user?.email.split('@')[0] ?? ''

  return {
    ...state,
    isGm: state.user?.role === 'gm',
    isAuthenticated: !!state.user,
    username,
  }
}
