import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Discover from "../components/Discover";
import HowItWorks from "../components/HowItWorks";
import About from "../components/About";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="min-h-screen bg-[#fffdf2]">
      <Navbar />

      <main>
        <Hero />
        <Discover />
        <HowItWorks />
        <About />
      </main>

      <Footer />
    </div>
  );
}

export default Home;