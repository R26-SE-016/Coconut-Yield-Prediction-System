import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Leaf, Signal, Gauge, CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Hero = ({ snapshotCards = [], systemSummary, connectionState, error }) => {
  const { t } = useTranslation();
  const focusCards = snapshotCards.slice(0, 4);

  return (
    <section id="home" className="relative pt-28 pb-18 lg:pt-40 lg:pb-28 overflow-hidden">
      {/* Background visual elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-10 opacity-20 text-[#166534]"
        >
          <Leaf size={120} />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 left-10 opacity-10 text-[#22c55e]"
        >
          <Leaf size={180} />
        </motion.div>
        
        {/* Abstract shapes */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#22c55e] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-[#fef08a] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-[#d9f2d0] text-[#166534] font-medium text-sm mb-8 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#166534]"></span>
            </span>
            {t('hero.subtitle')}
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
            {t('hero.title').split('Monitoring')[0]} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14532d] via-[#22c55e] to-[#84cc16]">
              {t('hero.title').includes('Monitoring') ? 'Monitoring System' : t('hero.title')}
            </span>
          </h1>
          
          <p className="mt-6 text-xl text-slate-700 leading-relaxed max-w-3xl mx-auto mb-10">
            {t('hero.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#dashboard" className="inline-flex justify-center items-center gap-2 px-8 py-4 bg-[#14532d] hover:bg-[#0f3d22] text-white rounded-2xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
              {t('hero.cta_view')}
              <ArrowRight size={20} />
            </a>
            <a href="#flow" className="inline-flex justify-center items-center gap-2 px-8 py-4 bg-white/80 hover:bg-white text-[#14532d] border border-[#d9f2d0] rounded-2xl font-semibold text-lg transition-all shadow-sm hover:shadow-md backdrop-blur-sm">
              {t('hero.cta_explore')}
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-left">
            {focusCards.map((card) => (
              <div key={card.title} className="rounded-3xl border border-white/70 bg-white/80 backdrop-blur-md p-4 shadow-[0_14px_40px_-20px_rgba(15,23,42,0.28)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t(`sensors.${card.title.toLowerCase().replace(' ', '_')}`, card.title)}</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">{card.value}</span>
                      <span className="pb-1 text-sm font-semibold text-slate-500">{card.unit}</span>
                    </div>
                  </div>
                  <div className={`rounded-2xl bg-gradient-to-br ${card.accent} p-3 ${card.ring}`}>
                    <Gauge size={20} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                  <span>{t(`sensors.${card.title.toLowerCase().replace(' ', '_')}_note`, card.note)}</span>
                  <span className="font-semibold text-slate-500">{connectionState === 'live' ? 'Live' : connectionState === 'demo' ? 'Demo' : 'Syncing'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur-md">
            <span className="inline-flex items-center gap-2">
              <Signal size={15} className="text-emerald-600" />
              {connectionState === 'live' ? 'Realtime feed connected' : connectionState === 'demo' ? 'Demo telemetry shown' : 'Connecting to telemetry'}
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="inline-flex items-center gap-2">
              <CalendarClock size={15} className="text-slate-500" />
              {systemSummary?.lastSync || 'Waiting for first reading'}
            </span>
            {error ? <span className="hidden sm:inline text-rose-600">{error}</span> : null}
          </div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 hidden md:flex flex-col items-center animate-bounce text-gray-400">
        <span className="text-sm font-medium mb-2">{t('hero.scroll_down')}</span>
        <ChevronDown size={24} />
      </div>
    </section>
  );
};

export default Hero;
