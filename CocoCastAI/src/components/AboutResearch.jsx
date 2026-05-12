import React from 'react';
import { BookOpen, Users, Target, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutResearch = () => {
  const { t } = useTranslation();

  return (
    <section id="research" className="py-24 bg-gradient-to-b from-white to-[#fefce8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-[#166534] rounded-full text-sm font-medium border border-[#bbf7d0] mb-6">
              <BookOpen size={16} />
              {t('research.title_badge', 'University Research Project')}
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">{t('research.title')}</h2>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {t('research.description')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{t('research.sensors_used')}</h4>
                  <p className="text-sm text-gray-500">DHT22, Soil Moisture Sensor, BH1750</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                  <Target size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{t('research.ai_model')}</h4>
                  <p className="text-sm text-gray-500">LSTM + Random Forest</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{t('research.purpose')}</h4>
                  <p className="text-sm text-gray-500">Yield prediction & plantation monitoring</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{t('research.target')}</h4>
                  <p className="text-sm text-gray-500">Farmers, estate managers, researchers</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square bg-gradient-to-tr from-[#166534] to-[#22c55e] rounded-[3rem] rotate-3 opacity-10 absolute inset-0 transform scale-105"></div>
            <div className="aspect-square bg-white border-8 border-white shadow-xl rounded-[3rem] overflow-hidden relative z-10 flex items-center justify-center bg-gradient-to-br from-[#fefce8] to-[#ecfccb]">
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-[#166534] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/20">
                  <BookOpen size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">CocoCast AI</h3>
                <p className="text-green-700 font-medium">Smart Coconut Yield Prediction Dashboard</p>
                <div className="mt-8 pt-8 border-t border-green-200">
                  <p className="text-sm text-gray-500">{t('research.footer_quote', 'Empowering Sri Lankan agriculture through artificial intelligence and IoT technology.')}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutResearch;
