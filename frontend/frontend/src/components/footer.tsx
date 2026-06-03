import React from 'react';
import { Mail, Github, Linkedin, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          
          {/* BAGIAN IKON MEDIA SOSIAL */}
          <div className="flex items-center space-x-8">
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#345d8a] transition-colors duration-300"
            >
              <Linkedin size={24} />
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#FF9ED2] transition-colors duration-300"
            >
              <Instagram size={24} />
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-black transition-colors duration-300"
            >
              <Github size={24} />
            </a>
          </div>

          {/* BAGIAN EMAIL */}
          <div className="flex items-center space-x-2 group">
            <Mail size={18} className="text-[#3D8278]" />
            <a 
              href="mailto:info@kalako.id" 
              className="text-gray-600 font-medium hover:text-[#3D8278] transition-colors duration-300"
            >
              kalako.pro@gmail.com
            </a>
          </div>

          {/* COPYRIGHT (Opsional, agar terlihat profesional) */}
          <div className="pt-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} PT. Karya Mulya Korpora. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;