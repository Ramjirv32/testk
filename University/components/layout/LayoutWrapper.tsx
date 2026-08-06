'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isDashboardPage = pathname?.startsWith('/user-dashboard')

  if (isAuthPage || isDashboardPage) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <div id="app">
        <main>{children}</main>
      </div>
      <Footer />
    </>
  )
}
