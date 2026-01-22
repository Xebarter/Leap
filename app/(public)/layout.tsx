import type { Metadata } from 'next'
import { PublicHeader } from '@/components/publicView/public-header'
import { PublicFooter } from '@/components/publicView/public-footer'

export const metadata: Metadata = {
  title: 'Leap - Find Your Perfect Home',
  description: 'Experience a new way to rent. Secure, transparent, and hassle-free residential property rental.',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
