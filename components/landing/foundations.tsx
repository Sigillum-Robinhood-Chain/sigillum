import { Eyebrow } from "@/components/ui/eyebrow";
import { Panel } from "@/components/ui/panel";
import { buttonClasses } from "@/components/ui/button-styles";
import { ButtonArrow } from "@/components/ui/button";
import { H2, Section } from "@/components/landing/section";
import { FOUNDATIONS } from "@/components/landing/copy";
import { WAGE_SPLIT } from "@/lib/currency";
import { GITHUB_URL } from "@/lib/social";
import type { ReactNode } from "react";

const SPLIT = [WAGE_SPLIT.patronsPct, WAGE_SPLIT.lampOilPct, WAGE_SPLIT.tithePct, WAGE_SPLIT.furnacePct].join("/");

function Card({ k, children }: { k: string; children: ReactNode }) {
  return (
    <Panel ticks className="rv">
      <div className="px-[26px] py-7">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">{k}</div>
        {children}
      </div>
    </Panel>
  );
}

const H4 = ({ children }: { children: ReactNode }) => (
  <h4 className="mt-3.5 mb-2 font-display text-[28px] font-normal leading-[1.1]">{children}</h4>
);
const P = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={className ?? "text-sm text-ink-2"}>{children}</p>
);
const CODE = "mt-4 block font-mono text-[11.5px] leading-[1.8] text-ice opacity-90";

export function Foundations() {
  return (
    <Section id="build">
      <Eyebrow className="rv">{FOUNDATIONS.eyebrow}</Eyebrow>
      <H2 parts={FOUNDATIONS.title} />
      <div className="mt-[50px] grid grid-cols-1 gap-3.5 min-[560px]:grid-cols-2 min-[1100px]:grid-cols-3">
        <Card k="Contract · Escrow">
          <H4>The Vault</H4>
          <P>On-chain escrow with pull-payment, so a contract payee can never block a release.</P>
          <code className={CODE}>
            createJob · setPayee · approve
            <br />
            refund · dispute · resolveDispute
          </code>
        </Card>
        <Card k="Contract · Distribution">
          <H4>The Splitter</H4>
          <P>Splits each sealed wage {SPLIT} and books the Reactor&apos;s share for a permissionless burn.</P>
          <code className={CODE}>
            registerJob · pullAndSplit
            <br />
            withdraw · burn
          </code>
        </Card>
        <Card k="Verification">
          <div className="mt-3.5 font-display text-[58px] leading-none text-gold-2">
            {FOUNDATIONS.testsPassing}
            <span className="text-[0.5em] text-ink-3"> / {FOUNDATIONS.testsPassing}</span>
          </div>
          <P className="mt-2.5 text-sm text-ink-2">
            Forge tests passing across both contracts, including 10,000-run fuzz tests. Slither
            reports no findings on the contracts&apos; own code.
          </P>
        </Card>
        <Card k="Network">
          <H4>Robinhood Chain</H4>
          <P>
            Ethereum L2. Mainnet chain ID {FOUNDATIONS.mainnetId}, testnet {FOUNDATIONS.testnetId}.
            Gas paid in ETH, verified on Blockscout.
          </P>
        </Card>
        <Card k="Minds">
          <H4>Bounded intelligence</H4>
          <P>
            Each mind runs with its own system prompt and Charter limits. A revision note reruns
            the same mind with the client&apos;s feedback.
          </P>
        </Card>
        <Card k="Stack">
          <H4>Built in the open</H4>
          <div className="mt-4 flex flex-wrap gap-2">
            {FOUNDATIONS.stack.map((s) => (
              <span
                key={s}
                className="rounded-full border border-line-2 px-2.5 py-[5px] font-mono text-[10.5px] tracking-[0.1em] text-ink-2"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="mt-[18px]">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "ghost", size: "small" })}
            >
              View source <ButtonArrow />
            </a>
          </div>
        </Card>
      </div>
    </Section>
  );
}
