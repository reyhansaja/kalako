import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="w-full bg-slate-50 py-20 overflow-hidden scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
          
          {/* SISI KIRI: IMAGE COMPOSITION */}
          <div className="w-full lg:w-1/2 relative flex justify-center items-center">
            
            {/* Gambar Utama */}
            <div className="relative w-64 h-[400px] md:w-80 md:h-[500px] overflow-hidden rounded-[200px] border-8 border-white shadow-xl z-0">
              <img
                src="/about.png"
                alt="Dashboard" 
                className="object-cover w-full h-full"
              />
            </div>

            {/* Gambar Kedua */}
            <div className="absolute -bottom-10 -right-5 md:bottom-10 md:-right-10 w-48 h-48 md:w-72 md:h-72 overflow-hidden rounded-full border-8 border-white shadow-2xl z-10">
              <img
                src="/logo1.png"
                alt="Laporan" 
                className="object-cover w-full h-full"
              />
            </div>
          </div>
          
          {/* SISI KANAN: TEXT CONTENT */}
          <div className="w-full lg:w-1/2 flex flex-col space-y-6">
             <h2 className="text-5xl md:text-6xl font-light text-[#212529] leading-tight">
               Tentang <span className="font-bold">Kalako</span>
             </h2>
             <p className="text-gray-600 text-lg">
                Kalako ERP merupakan solusi ERP berbasis cloud untuk UMKM dan retail yang ingin operasional lebih terstruktur, dan efisien.
             </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;