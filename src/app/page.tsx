import { PageLayout } from '@/components/PageLayout';
import { BackendStatus } from '@/components/BackendStatus';

export default function Home() {
  return (
    <PageLayout>
      <div className="flex flex-col gap-8">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to GTM
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Full-stack application with NestJS backend and Next.js frontend.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-medium mb-2">Backend status</h2>
          <BackendStatus />
        </section>
      </div>
    </PageLayout>
  );
}
