import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string;
  align?: "left" | "center";
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {image && (
        <div className="absolute inset-0 -z-10">
          <img src={image} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 hero-overlay" />
        </div>
      )}
      <div className="absolute inset-0 -z-10 starfield opacity-30 animate-drift" />
      <div className={`container-x py-24 md:py-32 ${align === "center" ? "text-center" : ""}`}>
        {eyebrow && (
          <div className="font-mono text-[11px] tracking-[0.3em] text-accent-blue mb-4 animate-fade-up">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05] animate-fade-up">
          {title}
        </h1>
        {description && (
          <p className={`mt-6 text-lg text-muted-foreground max-w-2xl ${align === "center" ? "mx-auto" : ""} animate-fade-up`}>
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
