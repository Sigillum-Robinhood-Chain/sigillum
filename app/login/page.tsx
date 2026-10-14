import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/login-form';
import { Panel } from '@/components/ui/panel';
import { PageHead } from '@/components/ui/page-head';
import { TERMS } from '@/lib/terms';
import { MotionHeader, MotionPage } from '@/components/motion/primitives';
import { SiteFooter } from '@/components/site-footer';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sudah login -- tidak ada gunanya melihat form ini lagi.
  if (user) redirect('/');

  const { error } = await searchParams;

  return (
    <MotionPage className="flex h-screen flex-col gap-3 px-3 pt-[78px] pb-3">

      <div className="flex flex-1 items-center justify-center overflow-auto py-2">
        <div className="w-full max-w-sm">
          <MotionHeader className="mb-5">
            <PageHead
              eyebrow="Account"
              title={
                <>
                  Sign <em>in</em>
                </>
              }
            />
          </MotionHeader>
          <Panel ticks>
            {error && (
              <p className="border-b border-line-2 bg-crit/10 px-3.5 py-2 text-[11.5px] text-crit">
                Sign-in didn&apos;t complete -- please try again below.
              </p>
            )}
            <LoginForm />
          </Panel>
        </div>
      </div>

      <SiteFooter note={TERMS.footerNote} />
    </MotionPage>
  );
}
