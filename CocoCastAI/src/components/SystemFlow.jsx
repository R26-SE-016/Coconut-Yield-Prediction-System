import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Server, FileCog, Brain, LayoutDashboard, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SystemFlow = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: <Cpu size={24} />,
      title: t('flow.step1_title'),
      desc: t('flow.step1_desc')
    },
    {
      icon: <Server size={24} />,
      title: t('flow.step2_title'),
      desc: t('flow.step2_desc')
    },
    {
      icon: <FileCog size={24} />,
      title: t('flow.step3_title'),
      desc: t('flow.step3_desc')
    },
    {
      icon: <Brain size={24} />,
      title: t('flow.step4_title'),
      desc: t('flow.step4_desc')
    },
    {
      icon: <LayoutDashboard size={24} />,
      title: t('flow.step5_title'),
      desc: t('flow.step5_desc')
    }
  ];

  return (
    <section id="flow" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('flow.title')}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('flow.subtitle')}</p>
        </div>

        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-10 right-10 h-1 bg-gradient-to-r from-gray-100 via-[#bbf7d0] to-[#166534] -translate-y-1/2 z-0 rounded-full"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm border transition-all duration-300 group-hover:scale-110 group-hover:shadow-md
                  ${index === steps.length - 1 ? 'bg-[#166534] text-white border-[#14532d]' : 'bg-white text-[#166534] border-[#bbf7d0]'}`}
                >
                  {step.icon}
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 w-full relative">
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                  
                  {/* Arrow for mobile/tablet */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden absolute -bottom-6 left-1/2 -translate-x-1/2 text-gray-300">
                      <ArrowRight size={20} className="rotate-90" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SystemFlow;
