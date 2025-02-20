import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoImage from '../../assets/images/alix-logo.png';

const WebsiteNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navItems = [
    { name: 'About', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'Roadmap', path: '/roadmap' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 px-8 py-6 transition-all duration-300 ${
        isScrolled ? 'bg-[#F8F7F4]/90 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <nav className="flex justify-between items-center max-w-7xl mx-auto">
        {/* Logo section */}
        <Link 
          to="/" 
          className="flex items-center gap-2 text-[#2F2F2F] hover:opacity-90 transition-opacity"
        >
          <img src={logoImage} alt="Alix Logo" className="h-8 w-8" />
          <span className="text-xl font-medium">Alix</span>
        </Link>

        {/* Desktop Navigation */}
        {!isLoginPage && (
          <div className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="text-[#575757] hover:text-[#2F2F2F] transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <a
              href="https://alixlibraries.typeform.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#8C7355] text-white px-6 py-2 rounded-lg 
                       hover:bg-[#755E45] transition-colors duration-300"
            >
              Join Waitlist
            </a>
          </div>
        )}

        {/* Mobile Menu Button */}
        {!isLoginPage && (
          <button
            className="md:hidden text-[#2F2F2F] hover:text-[#8C7355] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && !isLoginPage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#F8F7F4] border-t border-[#D8D3CC]"
          >
            <div className="px-4 py-6 space-y-4">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block text-[#575757] hover:text-[#2F2F2F] py-2 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <a
                href="https://alixlibraries.typeform.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#8C7355] text-white px-6 py-3 rounded-lg 
                         hover:bg-[#755E45] transition-colors duration-300 text-center"
              >
                Join Waitlist
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default WebsiteNavigation;