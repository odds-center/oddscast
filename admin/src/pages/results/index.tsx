import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Redirect /results → /races?view=results
export default function ResultsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/races?view=results');
  }, [router]);
  return null;
}
