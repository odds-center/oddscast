import { useState } from 'react';
import dynamic from 'next/dynamic';
import Icon from '@/components/icons';

// Lazy-load modal to keep initial bundle small
const BugReportModal = dynamic(() => import('./BugReportModal'), { ssr: false });

export default function BugReportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className='fixed bottom-24 right-4 z-40 w-11 h-11 rounded-full bg-white border border-stone-200 shadow-md flex items-center justify-center text-stone-500 hover:text-primary hover:border-primary transition-colors touch-manipulation'
        aria-label='버그 신고'
        title='버그 신고'
      >
        <Icon name='Bug' size={18} />
      </button>
      {open && <BugReportModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
