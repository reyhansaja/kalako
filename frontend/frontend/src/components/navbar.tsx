"use client";

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Logika untuk mendeteksi scroll agar navbar bisa diberi shadow saat discroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white ${
        isScrolled ? 'shadow-md' : 'border-b border-gray-100'
      }`}
    >
      {/* Garis tipis di paling atas sesuai gambar */}
      <div className="h-[1px] w-full bg-gray-200"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Bagian Kiri: Logo dan Tulisan */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer gap-2"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src="/logo1.png"
              alt="Kalako Logo" 
              className="object-contain w-8 h-8"
            />
            <span className="text-3xl font-bold flex items-center">
              {/* Logo 'o' ungu khas Odoo */}
              <span className="text-[#000000]">Kalako</span>
            </span>
          </div>

          {/* Bagian Tengah: Menu Navigasi */}
          <div className="hidden md:flex space-x-8 items-center">
            <a href="#about" className="text-[#4b5563] hover:text-[#875A7B] font-medium transition-colors">Tentang Kami</a>
            <a href="#vision" className="text-[#4b5563] hover:text-[#875A7B] font-medium transition-colors">Visi Misi</a>
            <a href="#values" className="text-[#4b5563] hover:text-[#875A7B] font-medium transition-colors">Nilai</a>
            <a href="#servis" className="text-[#4b5563] hover:text-[#875A7B] font-medium transition-colors">Fitur</a>
            <a href="https://drive.google.com/drive/folders/1Rjm0g3WFuHQjbdlERR3GBtal5VmdWtFO?usp=sharing" className="text-[#4b5563] hover:text-[#875A7B] font-medium transition-colors">Tutorial</a>
          </div>

          {/* Bagian Kanan: Login dan Button */}
          <div className="flex items-center space-x-4">
            <Link to="/root-login" className="text-[#4b5563] hover:text-[#875A7B] font-medium transition-colors">
              Login
            </Link>
            <Link to="/register" className="bg-[#875A7B] hover:bg-[#9a3f73] text-white px-5 py-2 rounded-md font-medium transition-all">
              Coba Gratis
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;