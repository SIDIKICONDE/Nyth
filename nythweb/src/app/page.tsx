import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Hero } from "@/components/sections/Hero"
import { Features } from "@/components/sections/Features"
import { Tutorials } from "@/components/sections/Tutorials"
import { Pricing } from "@/components/sections/Pricing"
import { CTA } from "@/components/sections/CTA"

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <Features />
        <Tutorials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  )
}