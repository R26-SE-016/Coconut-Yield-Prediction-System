import React from 'react';
import { Leaf, Github, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-[#102818] text-white py-12 border-t border-[#0d1d12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-2">
            <div className="bg-white/10 p-2 rounded-lg text-[#bbf7d0]">
              <Leaf size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight">CocoCast<span className="text-[#22c55e]">AI</span></span>
          </div>

          <div className="text-center md:text-right">
            <p className="text-green-100 font-medium mb-1">CocoCast AI &copy; 2026</p>
            <p className="text-green-300/80 text-sm">{t('hero.description')}</p>
            <div className="mt-3 flex items-center justify-center md:justify-end gap-4 text-sm text-green-200/80">
              <span className="inline-flex items-center gap-2"><Github size={14} />Firebase-ready frontend</span>
              <span className="inline-flex items-center gap-2"><ExternalLink size={14} />ESP32 telemetry</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
