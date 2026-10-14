'use client';

import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
} from '@reown/appkit/react';
import { useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { SUPPORTED_CHAIN_IDS } from '@/lib/web3/chains';
import { isWeb3Configured } from '@/lib/web3/config';
import { isWalletMode } from '@/lib/identity/mode';

function truncate(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Rendered instead of WalletConnectActive when wallet connect can't be used -- no Reown/wagmi
 *  hooks called here (unlike WalletConnectActive below), since those throw if the modal was
 *  never initialized (see web3-provider.tsx). Kept as a separate component rather than an
 *  early return inside WalletConnectActive so the hook calls below stay unconditional either
 *  way (rules-of-hooks). */
function WalletConnectDisabled({ reason }: { reason: string }) {
  return (
    <span
      title={reason}
      className="hdr-btn hidden cursor-not-allowed rounded-full border border-line-2 px-3 py-[7px] font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 opacity-60 min-[560px]:inline-block"
    >
      Connect wallet
    </span>
  );
}

/** Mode simulasi (escrow on-chain belum dikonfigurasi): tidak ada login dan tidak
 *  perlu wallet -- pemilik job = browser ini (lib/identity/sim-id.ts). */
function SimulationBadge() {
  return (
    <span
      title="Simulation mode: no wallet needed. SGUM are recorded in the database only, and the jobs you post belong to this browser. Wallet connect turns on once on-chain escrow is configured (NEXT_PUBLIC_WAGEHOLD_NETWORK + NEXT_PUBLIC_STRONGBOX_ADDRESS + NEXT_PUBLIC_WAGE_TOKEN_ADDRESS)."
      className="hdr-btn inline-flex items-center gap-2 rounded-full border border-line-2 px-3 py-[7px] font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3"
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-gold shadow-[0_0_8px_var(--color-gold)]"
      />
      Simulation
      <span className="hidden min-[560px]:inline"> · this browser</span>
    </span>
  );
}

/** Tautan kecil "Connect wallet" di dalam teks (Job Board / Job Detail). Hook AppKit hanya
 *  dipanggil di komponen terpisah yang dirender kalau AppKit memang diinisialisasi. */
function ConnectWalletLinkActive() {
  const { open } = useAppKit();
  return (
    <button
      type="button"
      onClick={() => open()}
      className="text-muted underline hover:text-text"
    >
      Connect your wallet
    </button>
  );
}

export function ConnectWalletLink() {
  if (!isWeb3Configured) {
    return (
      <span title="Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local to enable wallet connect">
        Connect your wallet
      </span>
    );
  }
  return <ConnectWalletLinkActive />;
}

function ConnectWalletButtonActive() {
  const { open } = useAppKit();
  return (
    <Button variant="primary" onClick={() => open()}>
      Connect wallet
    </Button>
  );
}

/** Tombol besar "Connect wallet" untuk empty state (Job Board). */
export function ConnectWalletButton() {
  if (!isWeb3Configured) {
    return (
      <Button
        variant="primary"
        disabled
        title="Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local to enable wallet connect"
      >
        Connect wallet
      </Button>
    );
  }
  return <ConnectWalletButtonActive />;
}

function WalletConnectActive() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { disconnect } = useDisconnect();

  if (!isConnected || !address) {
    return (
      <Button size="small" className="hdr-btn" onClick={() => open()}>
        Connect wallet
      </Button>
    );
  }

  const wrongNetwork =
    typeof chainId === 'number' && !SUPPORTED_CHAIN_IDS.has(chainId);

  if (wrongNetwork) {
    return (
      <button
        type="button"
        onClick={() => open({ view: 'Networks' })}
        className="inline-flex items-center rounded-full border border-ember px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ember transition-colors hover:bg-ember/10"
      >
        Wrong network -- switch
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="small"
        className="hdr-btn"
        onClick={() => open({ view: 'Account' })}
      >
        {truncate(address)}
      </Button>
      <button
        onClick={() => disconnect()}
        aria-label="Disconnect wallet"
        title="Disconnect wallet"
        className="grid size-[30px] place-items-center rounded-full border border-line-2 text-sm text-ink-3 transition-colors hover:border-gold hover:text-gold-2"
      >
        ×
      </button>
    </div>
  );
}

/** Identitas di header semua halaman -- menggantikan Sign in / Sign out (tidak ada login lagi). Ikon X/GitHub kini ada di SiteHeader.
 *
 *  - Mode wallet (escrow on-chain terkonfigurasi): tombol Connect wallet. Wallet inilah
 *    "akun" -- pemilik job = alamat yang mengunci wage.
 *  - Mode simulasi (default sekarang): lencana "Simulation" + tombol Connect wallet nonaktif.
 *    Pemilik job = browser ini, tanpa wallet.
 *
 *  `ml-auto` di sini (dulu di AuthStatus) yang mendorong blok ini ke kanan header. */
export function WalletConnect() {
  let content: React.ReactNode;
  if (!isWalletMode) {
    content = (
      <>
        <SimulationBadge />
        <WalletConnectDisabled reason="Simulation mode: no wallet needed. Wallet connect turns on once on-chain escrow (mainnet) is configured in .env.local." />
      </>
    );
  } else if (!isWeb3Configured) {
    content = (
      <WalletConnectDisabled reason="Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local (see .env.local.example) to enable wallet connect" />
    );
  } else {
    content = <WalletConnectActive />;
  }

  return (
    // Tanpa overflow-x-auto: nilai overflow selain `visible` memotong box-shadow (cincin gelap
    // 1px, cincin emas & glow saat hover) di keempat sisi sehingga border tampak terpotong.
    <div className="flex max-w-full items-center gap-2 [&>*]:shrink-0 [&>*]:whitespace-nowrap">
      {content}
    </div>
  );
}
