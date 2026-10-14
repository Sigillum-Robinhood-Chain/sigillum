import { Eyebrow } from "@/components/ui/eyebrow";
import { H2, Lede, Section } from "@/components/landing/section";
import { CHARTER } from "@/components/landing/copy";

export function Charter() {
  return (
    <Section id="charter">
      <div className="max-w-[1180px]">
        <Eyebrow className="rv">{CHARTER.eyebrow}</Eyebrow>
        <H2 parts={CHARTER.title} />
        <Lede parts={CHARTER.lede} />
        <div className="mt-[52px] grid grid-cols-1 border-t border-line min-[860px]:grid-cols-2">
          {CHARTER.articles.map((a, i) => (
            <article
              key={a.n}
              className={`rv d${i} grid grid-cols-[90px_1fr] gap-2.5 border-b border-line-2 py-7 min-[860px]:py-[34px] min-[860px]:odd:border-r min-[860px]:odd:pr-[34px] min-[860px]:even:pl-[34px]`}
            >
              <div className="font-display text-[46px] italic leading-none text-gold">{a.n}</div>
              <div>
                <h4 className="font-display text-[28px] font-normal leading-[1.15]">{a.title}</h4>
                <p className="mt-2 text-[14.5px] text-ink-2">{a.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
