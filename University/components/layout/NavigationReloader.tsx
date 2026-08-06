'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationReloader() {
  const pathname = usePathname();

  useEffect(() => {

    const previousPath = sessionStorage.getItem('previousPath');
    

    if (pathname === '/' && previousPath && previousPath !== '/') {
      sessionStorage.setItem('previousPath', pathname);
      window.location.reload();
    } else {

      sessionStorage.setItem('previousPath', pathname);
    }
  }, [pathname]);

  return null;
}
