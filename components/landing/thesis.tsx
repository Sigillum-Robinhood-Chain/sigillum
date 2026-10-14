import { Eyebrow } from "@/components/ui/eyebrow";
import { Panel } from "@/components/ui/panel";
import { H2, Lede, Section } from "@/components/landing/section";
import { THESIS } from "@/components/landing/copy";

export function Thesis() {
  return (
    <Section id="manifesto">
      <Eyebrow className="rv">{THESIS.eyebrow}</Eyebrow>
      <H2 parts={THESIS.title} />
      <Lede parts={THESIS.lede} />
      <div className="mt-14 grid max-w-[1240px] grid-cols-1 gap-[18px] min-[860px]:grid-cols-3">
        {THESIS.laws.map((law, i) => (
          <Panel key={law.n} ticks className={`rv d${i + 1}`}>
            <div className="px-7 pt-[30px] pb-8">
              <div className="font-mono text-[10.5px] tracking-[0.24em] text-ink-3">{law.n}</div>
              <div className="mt-5 text-sm text-ink-3 line-through decoration-ember/55">
                {law.old}
              </div>
              <h3 className="mt-2.5 mb-3 font-display text-[30px] font-normal leading-[1.1] text-gold-2">
                {law.title}
              </h3>
              <p className="text-[15px] text-ink-2">{law.body}</p>
            </div>
          </Panel>
        ))}
      </div>
    </Section>
  );
}
