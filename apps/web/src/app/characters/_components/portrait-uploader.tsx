'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

interface Props {
  characterId: string
  ownerId: string
  portraitUrl: string | null
  name: string
  isAlive: boolean
}

function getJwtSub(): string | null {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.sub as string
  } catch { return null }
}

export function PortraitUploader({ characterId, ownerId, portraitUrl, name, isAlive }: Props) {
  const [src, setSrc]         = useState(portraitUrl)
  const [isOwner, setIsOwner] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsOwner(getJwtSub() === ownerId)
  }, [ownerId])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5 MB'); return }

    setError(null)
    setUploading(true)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) { setError('No autenticado'); return }

      const form = new FormData()
      form.append('file', file)

      const res = await fetch(`${API_URL}/characters/${characterId}/portrait`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.message ?? `Error ${res.status}`)
        return
      }

      const updated = await res.json() as { portrait_url: string }
      setSrc(updated.portrait_url)
    } catch {
      setError('No se pudo subir la imagen')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const portrait = (
    <div className="relative h-64 w-full md:h-full" style={{ minHeight: '280px', maxHeight: '380px' }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name}
          className={`h-full w-full object-cover object-top transition-all duration-500 ${isAlive ? '' : 'grayscale'}`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-950 to-stone-900">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/10 font-display text-[2rem] font-bold text-amber-400">
            {name.charAt(0)}
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0c0a09] opacity-60 md:opacity-100" />
    </div>
  )

  if (!isOwner) return portrait

  return (
    <div className="group relative w-full shrink-0 cursor-pointer md:w-56 lg:w-72"
      onClick={() => !uploading && inputRef.current?.click()}
      title="Cambiar retrato">

      {portrait}

      {/* Hover overlay */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity ${
        uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      } bg-black/55`}>
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        ) : (
          <>
            <Camera className="h-8 w-8 text-amber-400" />
            <span className="mt-2 text-[0.72rem] font-medium tracking-wide text-amber-300">
              Cambiar retrato
            </span>
          </>
        )}
      </div>

      {error && (
        <div className="absolute bottom-2 left-2 right-2 rounded-md border border-red-500/30 bg-[#0c0a09]/90 px-2.5 py-1.5 text-[0.7rem] text-red-400">
          {error}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*"
        className="hidden" onChange={handleFileChange} />
    </div>
  )
}
