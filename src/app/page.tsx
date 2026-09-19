import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ChapterEditorial } from "@/components/landing/ChapterEditorial";
import { EventsPreview } from "@/components/landing/EventsPreview";
import { ExperiencesGrid } from "@/components/landing/ExperiencesGrid";
import { TrailPreview } from "@/components/landing/TrailPreview";
import { Atmosphere } from "@/components/landing/Atmosphere";
import { CountdownMoment } from "@/components/landing/CountdownMoment";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  ...(process.env.NEXT_PUBLIC_APP_URL ? {
    alternates: { canonical: new URL("/", process.env.NEXT_PUBLIC_APP_URL).toString() },
    openGraph: {
      title: "CHAPTER ONE — A new chapter begins",
      description: "Your college journey starts here. Events, experiences, and the Hidden Trail.",
      type: "website",
      images: [{ url: new URL("/images/hero.jpg", process.env.NEXT_PUBLIC_APP_URL).toString(), width: 1200, height: 900, alt: "CHAPTER ONE — golden light atmosphere study" }],
    },
    twitter: {
      card: "summary_large_image",
      images: [new URL("/images/hero.jpg", process.env.NEXT_PUBLIC_APP_URL).toString()],
    },
  } : {}),
};

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <ChapterEditorial />
        <Suspense fallback={<section className="section-c1 container-c1" aria-label="Upcoming events"><p role="status">Loading the lineup…</p></section>}>
          <EventsPreview />
        </Suspense>
        <ExperiencesGrid />
        <TrailPreview />
        <Atmosphere />
        <Suspense fallback={null}>
          <CountdownMoment />
        </Suspense>
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
