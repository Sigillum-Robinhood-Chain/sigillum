'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface JobTab {
  id: string;
  label: string;
  count: number;
  alert?: boolean; // dipakai untuk "Awaiting seal" — angka disorot warna warn
}

export function JobTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: JobTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex flex-wrap gap-x-5 border-b border-line-2 px-3.5 pt-2"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === active}
          onClick={() => onChange(t.id)}
          className={cn(
            'relative whitespace-nowrap border-b-2 border-transparent px-1 pb-[11px] pt-[9px] font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-3 transition-colors hover:text-gold-2',
            t.id === active && 'text-gold-2',
          )}
        >
          {t.label}
          <span
            className={cn(
              'ml-1.5 font-mono text-[10.5px] text-ink-3',
              t.alert && t.count > 0 && 'text-warn',
            )}
          >
            {t.count}
          </span>
          {/* Garis emas meluncur dari tab lama ke tab baru */}
          {t.id === active && (
            <motion.span
              layoutId="job-tab-underline"
              className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gold"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
