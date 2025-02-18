import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/auth/AuthContext';
import { supabase } from '../../../app/utils/supabase';
import { logger } from '../../../app/utils/logger';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/app/profile`
        }
      });

      if (error) throw error;

      setSuccess(true);
      logger.log('Magic link sent successfully to:', email);
    } catch (err) {
      logger.error('Error sending magic link:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col">
      {/* Navigation */}
      <nav className="w-full p-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-[#2F2F2F]">
          Alix
        </Link>
        <div className="flex items-center space-x-6">
          <Link to="/features" className="text-[#575757] hover:text-[#2F2F2F] transition-colors">
            Features
          </Link>
          <Link to="/about" className="text-[#575757] hover:text-[#2F2F2F] transition-colors">
            About
          </Link>
          <Link to="/community" className="text-[#575757] hover:text-[#2F2F2F] transition-colors">
            Community
          </Link>
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
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-[#D8D3CC]">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#2F2F2F] mb-2">
              Welcome to Alix
            </h2>
            <p className="text-[#575757]">
              Enter your email to receive a magic link for signing in
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2F2F2F] mb-2">
                Email address*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#8C7355]" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-[#D8D3CC] 
                           rounded-lg bg-white text-[#2F2F2F] placeholder-[#575757]
                           focus:outline-none focus:ring-2 focus:ring-[#8C7355] focus:border-transparent"
                  placeholder="Enter your email"
                  disabled={isLoading || success}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Magic link sent! Check your email to sign in.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || success || !email}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                         text-white bg-[#8C7355] hover:bg-[#755E45] focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-[#8C7355] transition-colors duration-200
                         ${(isLoading || success) ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Sending magic link...' : 
               success ? 'Magic Link Sent' : 'Sign In'}
            </button>
          </form>

          <div className="text-center text-sm text-[#575757] space-y-1">
            <p>You'll receive a magic link to sign in to your account.</p>
            <p>No password required!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;