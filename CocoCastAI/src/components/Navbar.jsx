import React, { useState, useEffect } from 'react';
import { Menu, X, Leaf, Wifi, WifiOff, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const LANGUAGE_OPTIONS = [
  { code: 'si', label: 'සිං' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'en', label: 'EN' },
];

const Navbar = ({ connectionState, lastSync, onOpenMetrics }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.home'), href: '#home' },
    { name: t('nav.dashboard'), href: '#dashboard' },
    { name: t('nav.analytics'), href: '#analytics' },
    { name: t('nav.system_flow'), href: '#flow' },
    { name: t('nav.research'), href: '#research' },
  ];

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#166534] p-2 rounded-lg text-white">
              <Leaf size={24} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-[#166534]">CocoCast<span className="text-[#22c55e]">AI</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                className="text-gray-700 hover:text-[#166534] font-medium transition-colors"
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={onOpenMetrics}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-semibold border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm"
            >
              <BarChart2 size={18} />
              <span className="hidden xl:inline">{t('metrics.view_details')}</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 rounded-full border border-[#d8f0d7] bg-white/75 px-4 py-2 shadow-sm backdrop-blur-md">
            {connectionState === 'live' ? (
              <Wifi size={16} className="text-emerald-600" />
            ) : (
              <WifiOff size={16} className="text-slate-400" />
            )}
            <div className="text-xs leading-tight">
              <div className="font-semibold text-slate-700">
                {connectionState === 'live' ? t('nav.live_data') : connectionState === 'demo' ? 'Demo Mode' : 'Connecting...'}
              </div>
              <div className="text-slate-500">{lastSync || 'Waiting...'}</div>
            </div>
            <div className="ml-2 flex items-center rounded-full bg-slate-100 p-1 text-[11px] font-semibold text-slate-600">
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleLanguageChange(option.code)}
                  className={`rounded-full px-3 py-1 transition-colors ${i18n.language === option.code ? 'bg-[#166534] text-white' : 'hover:bg-white'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={onOpenMetrics}
              className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100"
            >
              <BarChart2 size={24} />
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-[#166534] focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white shadow-lg border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <div className="flex items-center gap-2 px-3 pb-3 text-xs font-semibold text-slate-500">
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => handleLanguageChange(option.code)}
                    className={`rounded-full border px-3 py-1 ${i18n.language === option.code ? 'border-[#166534] bg-[#166534] text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-800 hover:text-[#166534] hover:bg-[#bbf7d0]/30 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
