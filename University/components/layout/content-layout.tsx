'use client'

import React from 'react'

interface ContentLayoutProps {
  children: React.ReactNode
  backgroundColor?: string
}

export function ContentLayout({
  children,
  backgroundColor = 'bg-gray-50',
}: ContentLayoutProps) {
  return (
    <div className={`min-h-screen ${backgroundColor} py-12 md:py-16`}>
      <div className="container mx-auto px-4">{children}</div>
    </div>
  )
}
