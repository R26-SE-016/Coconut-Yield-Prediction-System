import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Database, BrainCircuit, LayoutDashboard, Radio, CloudCog, ShieldCheck, TimerReset } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SystemOverview = () => {
  const { t } = useTranslation();

  const cards = [
    {
      title: t('overview.esp32_title'),
      description: t('overview.esp32_desc'),
      icon: <Cpu size={32} className="text-[#166534]" />,
      delay: 0.1
    },
    {
      title: t('overview.db_title'),
      description: t('overview.db_desc'),
      icon: <Database size={32} className="text-[#166534]" />,
      delay: 0.2
    },
    {
      title: t('overview.intel_title'),
      description: t('overview.intel_desc'),
      icon: <BrainCircuit size={32} className="text-[#166534]" />,
      delay: 0.3
    },
    {
      title: t('overview.dash_title'),
      description: t('overview.dash_desc'),
      icon: <LayoutDashboard size={32} className="text-[#166534]" />,
      delay: 0.4
    }
  ];

  return (
    <section className="py-20 bg-white/80 backdrop-blur-md relative z-20 -mt-10 mx-4 sm:mx-6 lg:mx-8 rounded-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.12)] border border-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d9f2d0] bg-[#f4fff2] px-4 py-2 text-sm font-semibold text-[#14532d] mb-5">
            <ShieldCheck size={16} />
            {t('overview.badge')}
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('overview.title')}</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t('overview.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: card.delay }}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-[#f7fff5] to-white p-8 rounded-[1.75rem] border border-[#d9f2d0] shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-16 h-16 bg-[#bbf7d0]/45 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
              <p className="text-slate-600 leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { icon: <Radio size={18} />, title: t('overview.live_sensing'), text: t('overview.live_sensing_desc') },
            { icon: <CloudCog size={18} />, title: t('overview.cloud_sync'), text: t('overview.cloud_sync_desc') },
            { icon: <ShieldCheck size={18} />, title: t('overview.op_health'), text: t('overview.op_health_desc') },
            { icon: <TimerReset size={18} />, title: t('overview.low_power'), text: t('overview.low_power_desc') },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#e6f5df] bg-[#f9fff7] p-4 text-left shadow-sm">
              <div className="flex items-center gap-2 text-[#14532d] font-semibold mb-2">{item.icon}{item.title}</div>
              <p className="text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SystemOverview;
