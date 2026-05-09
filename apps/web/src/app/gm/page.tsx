import type { Metadata } from 'next'
import { GmPanel } from './_components/gm-panel'

export const metadata: Metadata = {
  title: 'Panel GM — KMLog',
}

export default function GmPage() {
  return <GmPanel />
}
