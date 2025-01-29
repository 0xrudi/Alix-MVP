import React from 'react';
import { 
  Library,
  FolderHeart, 
  Sparkles, 
  Shield, 
  Network,
  MonitorPlay,
  Search,
  Tags,
  FolderTree
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div 
    className="p-8 bg-white rounded-lg border border-gray-200 hover:transform 
               hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
  >
    <div className="flex flex-col items-start space-y-4">
      <Icon className="w-8 h-8 text-[#8C7355]" />
      <h3 className="text-xl font-semibold text-[#2F2F2F]">{title}</h3>
      <p className="text-[#575757]">{description}</p>
    </div>
  </div>
);

const FeaturesPage = () => {
  const features = [
    {
      icon: Library,
      title: "Multi-Chain Support",
      description: "Seamlessly organize assets across Ethereum, Polygon, Base, and other major networks from a single interface."
    },
    {
      icon: FolderTree,
      title: "Enhanced Organization",
      description: "Create custom catalogs and folders to organize your digital artifacts in a way that makes sense for you."
    },
    {
      icon: Shield,
      title: "Spam Protection",
      description: "Advanced spam detection and management to keep your collection clean and organized."
    },
    {
      icon: FolderHeart,
      title: "Personal Collections",
      description: "Build and curate your own collections with an intuitive, library-inspired interface."
    },
    {
      icon: Network,
      title: "Cross-Chain View",
      description: "View and manage your entire collection across different networks in one unified interface."
    },
    {
      icon: MonitorPlay,
      title: "Rich Media Support",
      description: "Support for various media types including images, videos, audio, and interactive content."
    },
    {
      icon: Search,
      title: "Advanced Search",
      description: "Powerful search and filtering capabilities to find exactly what you're looking for."
    },
    {
      icon: Tags,
      title: "Smart Tagging",
      description: "Organize artifacts with custom tags and automated categorization."
    },
    {
      icon: Sparkles,
      title: "Peaceful Experience",
      description: "A calm, focused environment for browsing your digital artifacts without distractions."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-16">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2F2F2F]">
              Features
            </h1>
            <p className="text-xl text-[#575757]">
              A thoughtfully designed space for your digital artifacts
            </p>
            <a
              href="https://alixlibraries.typeform.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-[#8C7355] text-white rounded-lg 
                        hover:bg-[#755E45] transition-colors duration-300"
            >
              Join the Waitlist
            </a>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;