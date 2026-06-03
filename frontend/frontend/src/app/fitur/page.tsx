import React from 'react';
import { Users, Settings2, Lightbulb } from 'lucide-react';

const Servis: React.FC = () => {
  const serviceData = [
    {
      id: 1,
      title: "Manajemen Penjualan & Pembelian",
      description: "Faktur otomatis, histori transaksi, dan laporan profit real-time.",
      icon: <Users className="w-16 h-16 text-[#f09bda]" />, // Biru keabu-abuan sesuai tema sebelumnya
    },
    {
      id: 2,
      title: "Manajemen Stok & Inventori",
      description: "Pemantauan stok multi-gudang, peringatan stok habis, dan barcode system.",
      icon: <Settings2 className="w-16 h-16 text-[#f09bda]" />,
    },
    {
      id: 3,
      title: "Akuntansi & Keuangan",
      description: "Buku besar otomatis, arus kas, dan laporan laba rugi yang mudah dibaca.",
      icon: <Lightbulb className="w-16 h-16 text-[#f09bda]" />,
    }
  ];

  return (
    <section id="servis" className="w-full bg-white py-24 scroll-mt-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black tracking-wider uppercase">
           Fitur
          </h2>
          <div className="w-24 h-1 bg-[#9a3f73] mx-auto mt-4 rounded-full opacity-30"></div>
        </div>
        
        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          
          {serviceData.map((item) => (
            <div key={item.id} className="flex flex-col items-center text-center group">
              
              {/* ICON CONTAINER */}
              <div className="mb-8 p-6 bg-slate-50 rounded-2xl group-hover:bg-slate-100 transition-colors duration-300">
                {item.icon}
              </div>

              {/* TITLE */}
              <h3 className="text-2xl font-bold text-black mb-6 tracking-wide">
                {item.title}
              </h3>

              {/* DESCRIPTION */}
              <p className="text-gray-600 text-lg leading-relaxed max-w-sm">
                {item.description}
              </p>

            </div>
          ))}

        </div>
      </div>
    </section>
  );
};

export default Servis;