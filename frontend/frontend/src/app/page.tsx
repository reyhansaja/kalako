import Navbar from "@/components/navbar";
import HeroSection from "./landingpage/page"; 
import About from "./about/page";
import VisiMisi from "./visi-misi/page";
import CoreValues from "./core-values/page";
import Servis from "./fitur/page";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <About />
        <VisiMisi />
        <CoreValues />
        <Servis />
      </main>
      <Footer />
    </>
  );
}