import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ExperiencePreview } from "@/components/landing/ExperiencePreview";
import { EnergyStrip } from "@/components/landing/EnergyStrip";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />

      <Hero />

      <ExperiencePreview />

      <EnergyStrip />

      <Footer />
    </main>
  );
}