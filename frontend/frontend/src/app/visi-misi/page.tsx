import React from 'react';

const VisiMisi: React.FC = () => {
  return (
    <section id="vision" className="w-full bg-white py-14 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* JUDUL UTAMA */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black tracking-wider uppercase">
            ERP lokal andalan yang membantu UMKM tumbuh lebih rapi, modern, dan terukur.
          </h2>
          <div className="w-24 h-1 bg-[#9a3f73] mx-auto mt-4 rounded-full opacity-30"></div>
        </div>

        <div className='mt-23 mb-30 text-center'>
           <ul
               className="list-none pl-0 text-gray-600 text-2xl sm:text-3xl leading-relaxed space-y-3"
             style={{ fontFamily: '"Patrick Hand", "Segoe Print", "Segoe Script", cursive' }}
           >
                <li>
                  Menyediakan ERP yang
                  <span className="relative inline-block px-1">
                    {' '}simpel, terjangkau, dan siap dipakai UMKM.
                    <svg
                      className="absolute left-0 -bottom-2 w-full h-[12px] pointer-events-none"
                      viewBox="0 0 400 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M4 14 C80 10, 160 18, 240 12 C300 10, 360 16, 396 12"
                        stroke="#c30081"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 16 C82 12, 162 20, 242 14 C302 12, 362 18, 398 14"
                        stroke="#ec009c"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.65"
                      />
                    </svg>
                  </span>
                </li>
                <li>Menyajikan data bisnis melalui dashboard dan laporan yang 
                  <span className=' relative inline-block px-1'>
                    {' '}  akurat serta mudah dipahami.
                    <svg
                      className="absolute left-0 -bottom-2 w-full h-[12px] pointer-events-none"
                      viewBox="0 0 400 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M4 14 C80 10, 160 18, 240 12 C300 10, 360 16, 396 12"
                        stroke="#c30081"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 16 C82 12, 162 20, 242 14 C302 12, 362 18, 398 14"
                        stroke="#ec009c"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.65"
                      />
                    </svg>
                  </span>
                </li>
                <li>Memberikan dukungan pelanggan yang 
                  <span className='relative inline-block px-1'>
                  {' '}responsif dan solutif.
                  <svg
                      className="absolute left-0 -bottom-2 w-full h-[12px] pointer-events-none"
                      viewBox="0 0 400 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M4 14 C80 10, 160 18, 240 12 C300 10, 360 16, 396 12"
                        stroke="#c30081"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 16 C82 12, 162 20, 242 14 C302 12, 362 18, 398 14"
                        stroke="#ec009c"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.65"
                      />
                    </svg>
                  </span></li>
              </ul>
        </div>
      </div>
    </section>
  );
};

export default VisiMisi;