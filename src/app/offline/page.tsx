'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The standalone offline page has been removed. Downloaded songs are available
// via the Downloads feature (/downloads). This route now just redirects home.
export default function OfflinePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return null;
}
