'use client'

import { useState, useEffect } from 'react'

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

export function useAuth(): AuthState & { isGm: boolean; isAuthenticated: boolean } {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true })

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setState({ user: null, token: null, loading: false })
      return
    }

    const payload = decodeJwt(token)
    if (!payload || payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setState({ user: null, token: null, loading: false })
      return
    }

    setState({ user: payload, token, loading: false })
  }, [])

  return {
    ...state,
    isGm: state.user?.role === 'gm',
    isAuthenticated: !!state.user,
  }
}
