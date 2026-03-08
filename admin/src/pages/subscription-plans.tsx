import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Redirect /subscription-plans → /subscriptions
export default function SubscriptionPlansRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/subscriptions');
  }, [router]);
  return null;
}
