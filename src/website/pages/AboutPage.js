import React from 'react';
import { 
  BookOpen, 
  Heart, 
  Users,
  Sparkles
} from 'lucide-react';

const ValueCard = ({ icon: Icon, title, description }) => (
  <div className="p-8 bg-white rounded-lg border border-gray-200">
    <div className="flex flex-col items-center text-center space-y-4">
      <Icon className="w-8 h-8 text-[#8C7355]" />
      <h3 className="text-xl font-semibold text-[#2F2F2F]">{title}</h3>
      <p className="text-[#575757]">{description}</p>
    </div>
  </div>
);

const AboutPage = () => {
  const values = [
    {
      icon: BookOpen,
      title: "Personal Growth",
      description: "We believe in creating spaces that encourage learning, reflection, and personal curation."
    },
    {
      icon: Heart,
      title: "Intentional Design",
      description: "Every feature is thoughtfully crafted to provide a peaceful, focused experience."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Built by collectors, for collectors, with continuous feedback from our community."
    },
    {
      icon: Sparkles,
      title: "Cultural Impact",
      description: "Supporting the preservation and organization of digital culture for future generations."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Hero Section */}
      <div className="py-32 bg-[#EFEDE8] border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2F2F2F]">
              About Alix
            </h1>
            <p className="text-xl text-[#575757] leading-relaxed">
              Alix was born from a vision to simplify the management of digital assets
              in the increasingly complex Web3 ecosystem. We believe in creating a
              peaceful, focused environment for collectors to organize and experience
              their digital culture.
            </p>
            <a
              href="https://alixlibraries.typeform.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-[#8C7355] text-white rounded-lg 
                        hover:bg-[#755E45] transition-colors duration-300"
            >
              Join Our Journey
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-20">
          {/* Mission Section */}
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-bold text-[#2F2F2F]">Our Mission</h2>
            <p className="text-lg text-[#575757] leading-relaxed">
              We're on a mission to create the most thoughtful and peaceful way to
              organize your digital artifacts. In a world of endless social feeds
              and noisy platforms, we're building a quiet space for personal
              curation and meaningful engagement with your digital collection.
            </p>
          </div>

          {/* Values Section */}
          <div className="space-y-12 w-full">
            <h2 className="text-3xl font-bold text-[#2F2F2F] text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <ValueCard key={index} {...value} />
              ))}
            </div>
          </div>

          {/* Vision Section */}
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-bold text-[#2F2F2F]">Our Vision</h2>
            <p className="text-lg text-[#575757] leading-relaxed">
              We envision a future where digital artifacts are as cherished and
              well-organized as physical collections. Where technology serves to
              enhance our connection with digital culture, rather than
              distract from it. Join us in building this future, one personal
              library at a time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;