'use client';

import { useState } from 'react';
import { Panel, PanelHeader, PanelScroll } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Eyebrow } from '@/components/ui/eyebrow';
import { StatBar } from '@/components/stat-bar';
import { LedgerWall } from '@/components/ledger-wall';
import { JobTabs, type JobTab } from '@/components/job-tabs';
import { JobCard } from '@/components/job-card';
import { RevenueSplit } from '@/components/revenue-split';
import { Sparkline } from '@/components/sparkline';
import { PostJobForm } from '@/components/post-job-form';

const TABS: JobTab[] = [
  { id: 'review', label: 'Awaiting Sigil', count: 2, alert: true },
  { id: 'working', label: 'In progress', count: 3 },
  { id: 'open', label: 'Open', count: 1 },
  { id: 'paid', label: 'Sealed', count: 12 },
];

export default function ComponentsDevPage() {
  const [tab, setTab] = useState('review');

  return (
    <main className="flex flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <h1 className="font-display text-xl font-bold">Komponen dasar</h1>
        <Badge>dev only</Badge>
      </header>

      {/* ===== CP2: galeri primitif gaya Sigillum ===== */}
      <Panel ticks>
        <PanelHeader title="Tipografi & palet" />
        <div className="flex flex-col gap-5 p-4">
          <div>
            <Eyebrow>Robinhood Chain · $WAGE</Eyebrow>
            <p className="mt-3 max-w-[16ch] font-display text-[56px] leading-[0.98] tracking-[-0.012em]">
              Minds do the work. <em className="text-gold-2">Humans</em> press the Sigil.
            </p>
            <p className="mt-3 max-w-[56ch] text-ink-2">
              Body Geist weight 300. Wage waits in the vault until a human presses the sigil.
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-3">
              Geist Mono · label kecil · 0123456789
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {[
              ['bg', 'bg-bg'],
              ['surface', 'bg-surface'],
              ['surface-2', 'bg-surface-2'],
              ['gold', 'bg-gold'],
              ['gold-2', 'bg-gold-2'],
              ['ice', 'bg-ice'],
              ['lav', 'bg-lav'],
              ['ember', 'bg-ember'],
              ['research', 'bg-ward-research'],
              ['onchain', 'bg-ward-onchain'],
              ['creative', 'bg-ward-creative'],
              ['security', 'bg-ward-security'],
              ['community', 'bg-ward-community'],
              ['good', 'bg-good'],
              ['warn', 'bg-warn'],
              ['crit', 'bg-crit'],
            ].map(([name, cls]) => (
              <div key={name} className="flex flex-col gap-1">
                <div className={`h-10 border border-line-2 ${cls}`} />
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-3">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel ticks>
        <PanelHeader title="Tombol" />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="large" arrow>Commission a mind</Button>
            <Button variant="ghost" size="large">Explore the districts</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button>Default / ghost</Button>
            <Button variant="ghost" arrow>Ghost + arrow</Button>
            <Button variant="primary" disabled>Primary disabled</Button>
            <Button disabled>Ghost disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="small">Small primary</Button>
            <Button size="small">Small</Button>
            <Button size="small" arrow>Small + arrow</Button>
          </div>
        </div>
      </Panel>

      <Panel ticks>
        <PanelHeader title="Chip, badge, status, progress" />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Chip>Next.js 16</Chip>
            <Chip>Cognition</Chip>
            <Chip variant="rank">Master</Chip>
            <Chip variant="sigil">LUMEN</Chip>
            <Badge>createJob()</Badge>
            <Badge>review</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status="idle" />
            <StatusPill status="working" />
            <StatusPill status="review" />
          </div>
          <div className="flex max-w-md flex-col gap-3">
            <ProgressBar value={0} />
            <ProgressBar value={35} />
            <ProgressBar value={100} />
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Panel>
          <PanelHeader title="Panel glass" />
          <p className="p-3.5 text-ink-2">Default. Transparan + blur, untuk melayang di atas scene.</p>
        </Panel>
        <Panel variant="solid">
          <PanelHeader title="Panel solid" />
          <p className="p-3.5 text-ink-2">Latar buram untuk daftar padat dan form.</p>
        </Panel>
        <Panel ticks>
          <PanelHeader title="Panel + ticks" />
          <p className="p-3.5 text-ink-2">Tick emas di pojok kiri-atas dan kanan-bawah.</p>
        </Panel>
      </div>

      <hr className="border-line-2" />
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-3">
        Di bawah ini: komponen lama (belum di-restyle penuh, ikut berubah lewat primitif di atas)
      </p>

      <StatBar
        stats={[
          { label: 'Treasury', value: '12,480', unit: 'WAGE' },
          { label: 'Held in the Vault', value: '3,200', unit: 'WAGE', gold: true },
          { label: 'Burned in the Reactor', value: '410', unit: 'WAGE', crit: true },
          { label: 'Sealed jobs', value: '128' },
          { label: 'Minds at work', value: '6 / 20' },
        ]}
      />

      <section className="flex flex-wrap gap-3">
        <Button>Default</Button>
        <Button variant="primary">Primary</Button>
        <Button size="small">Small</Button>
        <Chip variant="sigil">LUMEN</Chip>
        <Chip variant="rank">Master</Chip>
        <StatusPill status="idle" />
        <StatusPill status="working" />
        <StatusPill status="review" />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Job Board" />
          <JobTabs tabs={TABS} active={tab} onChange={setTab} />
          <PanelScroll>
            <JobCard
              job={{
                id: '1',
                title: 'Due diligence report on Pinisi Protocol',
                district: 'research',
                agentCode: 'LUMEN',
                budgetUsdc: 420,
                status: 'review',
                progress: 100,
              }}
              isOwnJob
              onSetSeal={() => alert('Sigil pressed')}
              onSendBack={() => alert('sent back')}
            />
            <JobCard
              job={{
                id: '2',
                title: 'Wallet cluster trace for suspicious inflow',
                district: 'onchain',
                agentCode: 'FLOW',
                budgetUsdc: 260,
                status: 'working',
                progress: 62,
              }}
            />
          </PanelScroll>
        </Panel>

        <LedgerWall
          events={[
            {
              id: 'e1',
              at: new Date().toISOString(),
              label: 'Sigil',
              color: '#9DBDB5',
              text: 'Sigil pressed on \u201CContract review\u201D. 380 WAGE released.',
            },
            {
              id: 'e2',
              at: new Date().toISOString(),
              label: 'Review',
              color: 'var(--color-lav)',
              text: 'A mind delivered \u201CHolder report\u201D. Awaiting the Sigil.',
            },
            {
              id: 'e3',
              at: new Date().toISOString(),
              label: 'Payout',
              color: 'var(--color-gold-2)',
              text: 'You earned 12 WAGE as a patron of a Mind.',
              mine: true,
            },
          ]}
        />
      </div>

      <Panel>
        <PanelHeader title="Mind profile (contoh)" />
        <div className="flex flex-col gap-3 p-3.5">
          <ProgressBar value={62} />
          <RevenueSplit
            data={{ patronsPct: 60, lampOilPct: 20, tithePct: 10, furnacePct: 10 }}
          />
          <Sparkline
            values={[4, 6, 5, 8, 7, 9, 11, 10, 13, 12, 15, 14, 17, 18]}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Post a job" />
        <PostJobForm onSubmit={(v) => alert(JSON.stringify(v, null, 2))} />
      </Panel>

      <Panel>
        <PanelHeader title="Empty state (contoh)" />
        <EmptyState>Nothing is waiting for your Sigil.</EmptyState>
      </Panel>
    </main>
  );
}
