"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import CustomCursor from "@/components/shared/CustomCursor";
import LoadingScreen from "@/components/shared/LoadingScreen";
import ScrollProgress from "@/components/shared/ScrollProgress";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/sections/Hero";

const About = dynamic(() => import("@/sections/About"));
const Services = dynamic(() => import("@/sections/Services"));
const Projects = dynamic(() => import("@/sections/Projects"));
const TechStack = dynamic(() => import("@/sections/TechStack"));
const Testimonials = dynamic(() => import("@/sections/Testimonials"));
const Contact = dynamic(() => import("@/sections/Contact"));

export default function Home() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <CustomCursor />
      <ScrollProgress />

      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <Navbar />

      <main>
        <Hero />
        <About />
        <Services />
        <Projects />
        <TechStack />
        <Testimonials />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
