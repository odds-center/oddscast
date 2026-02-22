/**
 * Hit record banner — Yongsan comprehensive style
 * Top rolling/announcement banner
 */
import type { HitRecordDto } from '@/lib/api/predictionMatrixApi';
import Icon from '@/components/icons';

export interface HitRecordBannerProps {
  records: HitRecordDto[];
}

export default function HitRecordBanner({ records }: HitRecordBannerProps) {
  if (!records.length) return null;

  return (
    <div className='rounded-xl border border-stone-200 bg-stone-50 overflow-hidden mb-4'>
      <div className='flex items-center gap-2 px-4 py-2.5 border-b border-border'>
        <Icon name='Trophy' size={18} className='text-stone-600 shrink-0' />
        <span className='font-bold text-stone-800 text-sm'>적중 내역</span>
      </div>
      <div className='divide-y divide-border'>
        {records.map((r) => (
          <div key={r.id} className='px-4 py-2.5 text-sm'>
            <p className='font-medium text-foreground'>{r.description}</p>
            {r.details && (
              <p className='text-text-secondary text-xs mt-0.5'>{r.details}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
