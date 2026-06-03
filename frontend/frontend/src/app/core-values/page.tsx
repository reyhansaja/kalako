import React from 'react';

const CoreValues: React.FC = () => {
  return (
    <section id="values" className="w-full bg-white py-14 overflow-hidden scroll-mt-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* SISI KIRI: MENGGUNAKAN STATIC IMPORT */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-[500px]">
              {/* Dekorasi blur di belakang */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#9a3f73] rounded-full opacity-10 blur-2xl"></div>
              
              <div className="relative w-full h-auto">
                <img
                  src="/grafic.png"
                  alt="Kalako ERP Graphic" 
                  className="rounded-2xl shadow-lg border border-gray-100 z-10 w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* SISI KANAN: ICON TETAP KECIL & RAPI */}
          <div className="w-full lg:w-1/2 flex flex-col space-y-10">
            <div className="space-y-6">
              {/* Item 1 */}
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#FFD1E8] rounded-full opacity-30 scale-110"></div>
                  <div className="relative w-12 h-12 bg-[#FF9ED2] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                </div>
                <div className="pt-1">
                  <h4 className="text-xl font-bold text-gray-900 leading-none">Sederhana & Efisien</h4>
                  <p className="text-gray-600 text-base mt-1.5">Fokus pada fitur yang benar-benar dibutuhkan pelaku usaha.</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#FFD1E8] rounded-full opacity-30 scale-110"></div>
                  <div className="relative w-12 h-12 bg-[#FF9ED2] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="pt-1">
                  <h4 className="text-xl font-bold text-gray-900 leading-none">Ramah & Lokal</h4>
                  <p className="text-gray-600 text-base mt-1.5 leading-snug">Komunikasi mudah dipahami dan relevan dengan pasar lokal.</p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#FFD1E8] rounded-full opacity-30 scale-110"></div>
                  <div className="relative w-12 h-12 bg-[#FF9ED2] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="pt-1">
                  <h4 className="text-xl font-bold text-gray-900 leading-none">Akurat & Andal</h4>
                  <p className="text-gray-600 text-base mt-1.5 leading-snug">Data presisi untuk mendukung pengambilan keputusan.</p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#FFD1E8] rounded-full opacity-30 scale-110"></div>
                  <div className="relative w-12 h-12 bg-[#FF9ED2] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zM9.121 9.121a3 3 0 11-4.243-4.243 3 3 0 014.243 4.243z" />
                    </svg>
                  </div>
                </div>
                <div className="pt-1">
                  <h4 className="text-xl font-bold text-gray-900 leading-none">Inovatif & Adaptif</h4>
                  <p className="text-gray-600 text-base mt-1.5 leading-snug">Terus berkembang mengikuti tren bisnis terbaru.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CoreValues;