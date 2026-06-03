import React from 'react';

const HeroSection: React.FC = () => {
  return (
    /* 
       PENJELASAN PERUBAHAN:
       1. pt-20: Padding top untuk mobile (80px), cukup untuk menutupi tinggi navbar + jarak sedikit.
       2. lg:pt-32: Padding top untuk desktop (128px), jauh lebih kecil dari pt-48 sebelumnya.
       3. pb-10 / lg:pb-20: Mengurangi padding bawah agar section tidak terlalu memakan tempat.
    */
    <section className="relative w-full bg-white pt-20 pb-10 lg:pt-32 lg:pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          
          {/* SISI KIRI: TEXT & FORM */}
          <div className="w-full lg:w-1/2 flex flex-col space-y-6 z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#212529] leading-tight relative">
                <span style={{ color: '#670044' }}>Kalako,</span>{' '}
              <span className="relative inline-block align-middle">
                <span className="relative z-10">Teman Pintar</span>
              </span>
              <br />
              <span className="relative inline-block leading-tight">
  Usaha Kamu
  <svg
    className="absolute left-0 -bottom-2 w-full h-[20px] pointer-events-none"
    viewBox="0 0 300 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    {/* Main underline */}
    <path
      d="M4 14 
         C60 20, 120 6, 180 10
         C220 12, 260 8, 296 10"
      stroke="#c30081"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    {/* Secondary jitter for crayon feel */}
    <path
      d="M6 16 
         C62 22, 122 10, 182 14
         C222 16, 262 12, 298 14"
      stroke="#ec009c"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.6"
      fill="none"
    />
  </svg>
</span>
            </h1>

            <p className="text-gray-600 text-lg md:text-xl max-w-lg leading-relaxed">“Ngatur bisnis, jadi gampang!”
            </p>
          </div>

          {/* SISI KANAN: ILLUSTRATION */}
          <div className="w-full lg:w-1/2 relative flex justify-center items-center mt-8 lg:mt-0">
            <img 
              src="https://ubico.id/wp-content/uploads/2020/04/desktop.png" 
              alt="ERP Illustration" 
              className="w-full max-w-[400px] lg:max-w-[400px] h-auto object-contain"
            />
            
            <div className="absolute -z-10 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;