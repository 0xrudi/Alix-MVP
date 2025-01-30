import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter } from 'lucide-react';

const WebsiteFooter = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', path: '/features' },
        { name: 'About', path: '/about' },
        { name: 'Community', path: '/community' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', path: '/docs' },
        { name: 'Help Center', path: '/help' },
        { name: 'Contact', path: '/contact' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms of Service', path: '/terms' },
      ]
    }
  ];

  return (
    <footer className="bg-[#EFEDE8] border-t border-[#D8D3CC]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link to="/" className="text-2xl font-bold text-[#2F2F2F]">
              Alix
            </Link>
            <p className="mt-4 text-[#575757]">
              Your personal digital library for the Web3 era.
            </p>
            <div className="flex space-x-4 mt-6">
              <a 
                href="https://github.com/your-repo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#575757] hover:text-[#2F2F2F] transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a 
                href="https://twitter.com/your-handle" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#575757] hover:text-[#2F2F2F] transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map(section => (
            <div key={section.title}>
              <h3 className="text-[#2F2F2F] font-semibold mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map(link => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-[#575757] hover:text-[#2F2F2F] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#D8D3CC] flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-[#575757] text-sm">
            © {currentYear} Alix. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <Link 
              to="/privacy" 
              className="text-[#575757] hover:text-[#2F2F2F] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              className="text-[#575757] hover:text-[#2F2F2F] transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;