import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WebsiteNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

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
    { name: 'Community', path: '/community' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/90 backdrop-blur-sm shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-bold text-[#2F2F2F] hover:text-[#8C7355] transition-colors"
          >
            Alix
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#2F2F2F] hover:text-[#8C7355] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-[#D8D3CC]"
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
              <Link
                to="/signup"
                className="block bg-[#8C7355] text-white px-6 py-3 rounded-lg 
                           hover:bg-[#755E45] transition-colors duration-300 text-center"
              >
                Start
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default WebsiteNavigation;