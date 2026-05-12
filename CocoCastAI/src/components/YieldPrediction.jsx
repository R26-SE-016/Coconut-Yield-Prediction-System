import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Info, TrendingUp, Calculator, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

const YieldPrediction = ({ forecast, runPrediction, isPredicting, predictionResult, farmProfile, onOpenMetrics }) => {
  const { t } = useTranslation();
  const [numTrees, setNumTrees] = useState(farmProfile?.treeCount || 100);

  const {
    estimatedYield,
    confidence,
    status,
    message,
    healthScore,
    band,
  } = forecast;

  // Use live prediction result if available, otherwise use default forecast
  const displayYield = predictionResult ? predictionResult.predicted_yield_nuts : estimatedYield;
  const displayStatus = predictionResult ? predictionResult.yield_status : status;
  const displayConfidence = predictionResult ? (predictionResult.confidence_level === "High" ? 92 : 75) : confidence;

  const chartData = [
    { name: 'Average Yield', value: 6500, fill: '#cbd5e1' },
    { name: 'Predicted Yield', value: displayYield, fill: band.ring }
  ];

  useEffect(() => {
    if (farmProfile?.treeCount) {
      setNumTrees(Number(farmProfile.treeCount));
    }
  }, [farmProfile?.treeCount]);

  const handlePredict = (e) => {
    e.preventDefault();
    runPrediction(numTrees);
  };

  return (
    <section id="prediction-section">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('prediction.title')}</h2>
          <p className="text-slate-600">{t('prediction.subtitle')}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-50 px-3 py-1 border border-slate-100">Farm: {farmProfile?.farmName || 'Not set'}</span>
            <span className="rounded-full bg-slate-50 px-3 py-1 border border-slate-100">Block: {farmProfile?.block || 'Not set'}</span>
            <span className="rounded-full bg-slate-50 px-3 py-1 border border-slate-100">Trees: {farmProfile?.treeCount || '0'}</span>
            <span className="rounded-full bg-slate-50 px-3 py-1 border border-slate-100">Age: {farmProfile?.cropAge || '0'} years</span>
            <span className="rounded-full bg-slate-50 px-3 py-1 border border-slate-100">Location: {farmProfile?.location || 'Not set'}</span>
          </div>
        </div>
        
        <form onSubmit={handlePredict} className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col px-3">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('prediction.tree_count_label')}</label>
            <input 
              type="number" 
              value={numTrees} 
              onChange={(e) => setNumTrees(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-bold text-slate-700 w-24 p-0"
            />
          </div>
          <button 
            type="submit"
            disabled={isPredicting}
            className="bg-[#14532d] hover:bg-[#166534] text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {isPredicting ? <Loader2 className="animate-spin" size={18} /> : <Calculator size={18} />}
            {isPredicting ? t('prediction.calculating') : t('prediction.predict_button')}
          </button>
        </form>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-md rounded-[2rem] border border-white/70 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#22c55e] via-[#84cc16] to-[#14532d]"></div>
        
        <div className="p-8 md:p-12 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Main Output Column */}
          <div className="lg:col-span-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-[#166534] rounded-full text-sm font-medium border border-emerald-100 mb-6">
              <TrendingUp size={16} />
              {t('prediction.model_active')}
            </div>
            
            <h3 className="text-slate-500 font-medium mb-2 uppercase tracking-wider text-sm">{t('prediction.estimated_harvest')}</h3>
            <div className="flex items-baseline gap-3 mb-8">
              <AnimatePresence mode="wait">
                <motion.span 
                  key={displayYield}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-6xl md:text-7xl font-extrabold text-[#14532d] tracking-tight"
                >
                  {displayYield.toLocaleString()}
                </motion.span>
              </AnimatePresence>
              <span className="text-2xl text-slate-500 font-medium">{t('prediction.nuts_per_cycle')}</span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 text-sm">{t('prediction.confidence')}</span>
                <span className="text-xl font-bold text-slate-900">{displayConfidence}%</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 text-sm">{t('prediction.condition')}</span>
                <span className={`font-bold px-3 py-1 rounded-lg text-sm ${band.tone}`}>{displayStatus}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-slate-600 bg-sky-50 px-4 py-4 rounded-2xl border border-sky-100">
              <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <span>{predictionResult ? t('prediction.updated_note', "Prediction updated with your tree count and real-time sensor data.") : message}</span>
            </div>
          </div>

          {/* Graphical Visualization Column */}
          <div className="lg:col-span-1 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={20} className="text-slate-400" />
              <h3 className="text-lg font-bold text-slate-900">{t('prediction.comparison_title')}</h3>
            </div>
            
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis hide domain={[0, 12000]} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} nuts`, 'Yield']}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 text-center mt-4 italic">{t('prediction.comparison_baseline')}</p>
          </div>

          {/* Status Indicator Column */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#f7fff5] to-white rounded-[1.75rem] p-8 border border-[#d9f2d0]/60">
            <h3 className="text-xl font-bold text-slate-900 mb-8 text-center">{t('prediction.condition_level')}</h3>
            
            <div className="relative w-44 h-44 mb-8 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="88" cy="88" r="80" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <motion.circle 
                  initial={{ strokeDasharray: "0 1000" }}
                  animate={{ strokeDasharray: `${(displayConfidence/100) * 502} 1000` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  cx="88" cy="88" r="80" fill="none" stroke={band.ring} strokeWidth="12" strokeLinecap="round" 
                />
              </svg>
              
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <div className="text-white p-3 rounded-full mb-2 shadow-lg" style={{ backgroundColor: band.ring }}>
                  <Sprout size={28} />
                </div>
                <span className="text-2xl font-bold text-slate-900">{band.label}</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-slate-500 text-xs mt-2 mb-6">{t('prediction.live_data_note', 'Based on live environmental data combined with AI model insights.')}</p>
              <button 
                onClick={onOpenMetrics}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#166534] border-2 border-[#166534]/10 hover:border-[#166534] hover:bg-[#166534] hover:text-white rounded-xl font-bold transition-all duration-300 shadow-sm"
              >
                <BarChart3 size={18} />
                {t('metrics.view_details')}
              </button>
            </div>
          </div>
          
        </div>
      </motion.div>
    </section>
  );
};

export default YieldPrediction;
