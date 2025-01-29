import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Book, Music, FileText, Palette } from 'lucide-react';
import gridImage from '../../assets/images/library-grid.png';
import logoImage from '../../assets/images/alix-logo.png';

const sections = [
  { id: 'hero', label: 'Welcome' },
  { id: 'experience', label: 'Experience' },
  { id: 'collection', label: 'Collections' },
  { id: 'personal', label: 'Personal Space' },
  { id: 'community', label: 'Community' }
];

const LandingPage = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrolling) return;

      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) {
          const { top } = element.getBoundingClientRect();
          if (top < windowHeight / 2 && top > -windowHeight / 2) {
            setActiveSection(section.id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolling]);

  const scrollToSection = (sectionId) => {
    setScrolling(true);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => setScrolling(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] relative overflow-x-hidden">
      {/* Navigation Dots */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className="flex flex-col items-end gap-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="group flex items-center"
            >
              <span className="hidden group-hover:block mr-2 text-sm text-[#575757] whitespace-nowrap">
                {section.label}
              </span>
              <div 
                className={`w-2 h-2 rounded-full border border-[#8C7355] transition-all duration-300 ease-in-out
                           ${activeSection === section.id ? 'bg-[#8C7355] scale-150' : 'bg-transparent'} 
                           hover:bg-[#8C7355] hover:scale-150`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 bg-[#F8F7F4]/90 backdrop-blur-sm">
      <nav className="flex justify-between items-center max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
        <img src={logoImage} alt="" className="h-8 w-8" />
          <span className="text-[#2F2F2F] text-xl">Alix</span>
        </Link>
        
        <div className="flex items-center gap-8">
          <Link to="/about" className="text-[#575757] hover:text-[#2F2F2F] transition-colors">
            About
          </Link>
          <Link to="/features" className="text-[#575757] hover:text-[#2F2F2F] transition-colors">
            Features
          </Link>
          <Link to="/community" className="text-[#575757] hover:text-[#2F2F2F] transition-colors">
            Community
          </Link>
          <a
            href="https://alixlibraries.typeform.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#8C7355] text-white px-6 py-2 rounded-lg hover:bg-[#755E45] transition-colors duration-300"
          >
            Join Waitlist
          </a>
        </div>
      </nav>
    </header>

      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img src={logoImage} alt="Alix Logo" className="w-20 h-20 mx-auto mb-8" />
            <h1 className="text-6xl font-light mb-6 text-[#2F2F2F]">
              Welcome Home to<br />Your Onchain Library
            </h1>
            <p className="text-xl text-[#575757] mb-8">
              A cozy corner for your digital artifacts, thoughtfully organized.
            </p>
            <Link
              to="/login"
              className="inline-block bg-[#8C7355] text-white px-8 py-4 rounded-lg 
                         hover:bg-[#755E45] transition-colors duration-300"
            >
              Start Your Library
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Library Experience Section */}
      <section id="experience" className="min-h-screen flex items-center px-4 bg-[#EFEDE8]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-20%" }}
          >
            <h2 className="text-4xl mb-6 text-[#2F2F2F]">
              A Homemade Approach to Onchain Organizing
            </h2>
            <p className="text-xl text-[#575757] mb-12">
              Built by collectors, for collectors.
            </p>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <img 
                src={gridImage} 
                alt="Alix Library Grid View"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Collection Types Section */}
      <section id="collection" className="min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-20%" }}
          >
            <h2 className="text-4xl text-center text-[#2F2F2F] mb-16">
              Take your shoes off, it's time to get comfortable
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-[#D8D3CC]
                            hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
                <Music className="w-16 h-16 mx-auto mb-6 text-[#8C7355]" />
                <h3 className="text-2xl mb-4 text-[#2F2F2F]">Audio</h3>
                <p className="text-[#575757]">
                  Sound.xyz<br />Pods.media
                </p>
              </div>

              <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-[#D8D3CC]
                            hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
                <FileText className="w-16 h-16 mx-auto mb-6 text-[#8C7355]" />
                <h3 className="text-2xl mb-4 text-[#2F2F2F]">Writing</h3>
                <p className="text-[#575757]">
                  Paragraph<br />Mirror
                </p>
              </div>

              <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-[#D8D3CC]
                            hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
                <Palette className="w-16 h-16 mx-auto mb-6 text-[#8C7355]" />
                <h3 className="text-2xl mb-4 text-[#2F2F2F]">Art</h3>
                <p className="text-[#575757]">
                  Art Blocks<br />SuperRare
                </p>
              </div>

              <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-[#D8D3CC]
                            hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
                <Book className="w-16 h-16 mx-auto mb-6 text-[#8C7355]" />
                <h3 className="text-2xl mb-4 text-[#2F2F2F]">Collectibles</h3>
                <p className="text-[#575757]">
                  Zora<br />Rodeo
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Personal Space Section */}
      <section id="personal" className="min-h-screen flex items-center bg-[#EFEDE8] px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-20%" }}
          >
            <h2 className="text-4xl mb-12 text-[#2F2F2F]">
              Your Space, Your Pace
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-2xl mb-4 text-[#2F2F2F]">Organize thoughtfully</h3>
                <p className="text-[#575757]">Create your perfect organization system</p>
              </div>
              <div>
                <h3 className="text-2xl mb-4 text-[#2F2F2F]">Browse peacefully</h3>
                <p className="text-[#575757]">No distractions, just your collection</p>
              </div>
              <div>
                <h3 className="text-2xl mb-4 text-[#2F2F2F]">Experience fully</h3>
                <p className="text-[#575757]">Immerse yourself in your digital library</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="min-h-screen flex items-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-20%" }}
          >
            <h2 className="text-4xl mb-6 text-[#2F2F2F]">Growing Together</h2>
            <p className="text-xl text-[#575757] mb-12">
              Share your thoughts. Shape our future.
            </p>
            <Link
              to="/contact"
              className="inline-block bg-[#8C7355] text-white px-8 py-4 rounded-lg 
                         hover:bg-[#755E45] transition-colors duration-300"
            >
              Join the Community
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;