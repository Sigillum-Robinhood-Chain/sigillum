'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { FIELD_HINT, FIELD_INPUT, FIELD_LABEL } from '@/components/ui/field';
import { WARD_LABEL } from '@/types/domain';
import { WAGE_SPLIT, WAGE_TOKEN } from '@/lib/currency';
import { isOnChainEscrowConfigured } from '@/lib/web3/strongbox';
import { takeContinueDraft } from '@/lib/continue-job';
import type { DistrictId } from '@/types/domain';

export interface PostJobValues {
  title: string;
  brief: string;
  district: DistrictId;
  budgetUsdc: number;
  /** Hire langsung: id bangunan (Wright) pilihan client. Kosong = Warden yang memilih. */
  agentId?: string;
}

/** Bangunan (Wright) yang bisa dipilih di Gate. */
export interface PostJobBuilding {
  id: string;
  name: string;
  code: string;
  district: DistrictId;
}

export function PostJobForm({
  onSubmit,
  submitting,
  submittingLabel,
  initialDistrict,
  initialAgentId,
  buildings = [],
}: {
  onSubmit: (values: PostJobValues) => void;
  submitting?: boolean;
  /** Label tombol yang lebih spesifik selagi submitting (mis. "Approving
   *  $SGUM…" / "Saving job…" dari alur on-chain, Fase 2 item 6). Jatuh ke
   *  "Locking wage…" kalau tidak diisi. */
  submittingLabel?: string;
  /** Dipakai saat datang dari tombol "Hire" di Page E (Wright Profile) --
   *  belum jadi assignment langsung ke Wright itu (Warden yang merutekan
   *  job, Fase 3 item 5), jadi baru sebatas mem-prefill Ward-nya. */
  initialDistrict?: DistrictId;
  /** ?agent= dari tombol "Hire {nama}" -- bangunan yang sudah terpilih. */
  initialAgentId?: string;
  /** Wright yang bisa di-hire langsung (Warden tidak termasuk). */
  buildings?: PostJobBuilding[];
}) {
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [district, setDistrict] = useState<DistrictId>(
    initialDistrict ?? 'research',
  );
  const [budget, setBudget] = useState('');
  const [agentId, setAgentId] = useState<string>(
    buildings.some((b) => b.id === initialAgentId)
      ? (initialAgentId ?? '')
      : '',
  );
  // Datang dari "Continue in another Ward" di halaman job: judul + brief terisi dari
  // job sebelumnya (draft sekali pakai di sessionStorage). Hanya mengisi kolom yang
  // masih kosong. Dibaca setelah mount -- sessionStorage tidak ada saat SSR.
  const [continueFrom, setContinueFrom] = useState<string | null>(null);
  useEffect(() => {
    const draft = takeContinueDraft();
    if (!draft) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle((t) => t || draft.title);
    setBrief((b) => b || draft.brief);
    setContinueFrom(draft.fromLabel);
  }, []);
  const chosen = buildings.find((b) => b.id === agentId);
  // Building yang ditawarkan hanya milik Ward yang sedang dipilih.
  const activeWard = chosen ? chosen.district : district;
  const wardBuildings = buildings.filter((b) => b.district === activeWard);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const budgetUsdc = Number(budget);
    if (!title || !brief || !budgetUsdc) return;
    onSubmit({
      title,
      brief,
      // Bangunan pilihan menentukan Ward-nya.
      district: chosen ? chosen.district : district,
      budgetUsdc,
      ...(chosen ? { agentId: chosen.id } : {}),
    });
  }

  const labelClass = FIELD_LABEL;
  const inputClass = `${FIELD_INPUT} w-full`;

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3.5 p-5 sm:grid-cols-2"
    >
      {continueFrom && (
        <p className="col-span-full rounded-panel border border-gold/40 bg-gold/[0.07] px-3 py-2.5 text-[12px] text-ink-2">
          Continuing from {continueFrom}. Write what you want next under
          &ldquo;What I want next&rdquo;, then pick the District that should take
          it. This is a new job with its own SGUM; the earlier job is not
          affected.
        </p>
      )}

      <label className={`${labelClass} col-span-full`}>
        Job title
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='e.g. "Due diligence report on Pinisi Protocol"'
          required
        />
      </label>

      <label className={`${labelClass} col-span-full`}>
        Brief
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="What does the Mind need to deliver?"
          required
        />
      </label>

      <label className={labelClass}>
        District
        <select
          className={inputClass}
          value={chosen ? chosen.district : district}
          onChange={(e) => {
            const next = e.target.value as DistrictId;
            setDistrict(next);
            // Ganti Ward yang tidak cocok dengan bangunan terpilih -> kembali ke Warden.
            if (chosen && chosen.district !== next) setAgentId('');
          }}
        >
          {Object.entries(WARD_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {buildings.length > 0 && (
        <label className={`${labelClass} col-span-full`}>
          Building
          <select
            className={inputClass}
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          >
            <option value="">Let the District&apos;s Steward choose</option>
            {wardBuildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.code}
              </option>
            ))}
          </select>
          <span className={FIELD_HINT}>
            {`Optional. Pick a building to hire it directly; its patrons share the ${WAGE_SPLIT.patronsPct}% patron cut when you press the Sigil.`}
          </span>
        </label>
      )}

      <label className={labelClass}>
        Amount ({WAGE_TOKEN})
        <input
          className={inputClass}
          type="number"
          min={1}
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="420"
          required
        />
      </label>

      <p className="col-span-full text-[11.5px] text-ink-3">
        Priced and paid in {WAGE_TOKEN}. On Sigil: {WAGE_SPLIT.patronsPct}%
        patrons · {WAGE_SPLIT.lampOilPct}% Grid reserve · {WAGE_SPLIT.tithePct}%
        Civic fund · {WAGE_SPLIT.furnacePct}% burned.
      </p>

      {!isOnChainEscrowConfigured && (
        <p className="col-span-full text-[11.5px] text-ink-3">
          Simulation mode: the SGUM is recorded in the database only. No{' '}
          {WAGE_TOKEN} is moved and no wallet is needed.
        </p>
      )}

      <div className="col-span-full flex justify-end border-t border-line-2 pt-4">
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting
            ? (submittingLabel ?? 'Locking SGUM…')
            : 'Lock SGUM in the Vault'}
        </Button>
      </div>
    </form>
  );
}
