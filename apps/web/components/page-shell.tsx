import Link from "next/link";
import { ReactNode } from "react";

type PageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
};

const links = [
  { href: "/", label: "总览" },
  { href: "/projects/new", label: "新建任务" }
];

export function PageShell({ title, subtitle, children, actions }: PageShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div>
            <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
              Research Lineage Agent
            </Link>
            <p className="mt-1 text-sm text-steel">面向科研选题、论文池、图谱与报告的助手骨架</p>
          </div>
          <nav className="flex items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-6 py-6 shadow-panel md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-steel">{subtitle}</p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </section>

        {children}
      </main>
    </div>
  );
}

