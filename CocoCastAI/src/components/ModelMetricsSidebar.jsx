import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useTranslation } from 'react-i18next';
import { X, BarChart2, Target, Activity, Award, TrendingUp, AlertCircle } from 'lucide-react';

const ModelMetricsSidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('hybrid');

  const models = {
    rf: {
      name: 'Random Forest',
      badge: '⭐ BEST',
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Handles tabular data excellently. Robust to outliers & non-linear patterns.',
      metrics: [
        { label: 'MAE', fullName: 'Mean Absolute Error', value: '106.29', unit: 'nuts', position: 1 },
        { label: 'RMSE', fullName: 'Root Mean Squared Error', value: '143.41', unit: 'nuts', position: 2 },
        { label: 'R²', fullName: 'Coefficient of Determination', value: '0.9845', unit: '(98.45%)', position: 3 },
        { label: 'MAPE', fullName: 'Mean Absolute Percentage Error', value: '5.09', unit: '%', position: 4 },
      ]
    },
    lstm: {
      name: 'LSTM Neural Network',
      badge: '🔄 TEMPORAL',
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Captures sequential patterns. Struggles with simplified data structure.',
      metrics: [
        { label: 'MAE', fullName: 'Mean Absolute Error', value: '315.09', unit: 'nuts', position: 1 },
        { label: 'RMSE', fullName: 'Root Mean Squared Error', value: '426.78', unit: 'nuts', position: 2 },
        { label: 'R²', fullName: 'Coefficient of Determination', value: '0.8629', unit: '(86.29%)', position: 3 },
        { label: 'MAPE', fullName: 'Mean Absolute Percentage Error', value: '21.95', unit: '%', position: 4 },
      ]
    },
    hybrid: {
      name: 'Hybrid (0.6 RF + 0.4 LSTM)',
      badge: '🎖️ PRODUCTION',
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      description: 'Combines RF stability with LSTM insights. Optimal for production use.',
      metrics: [
        { label: 'MAE', fullName: 'Mean Absolute Error', value: '159.57', unit: 'nuts', position: 1 },
        { label: 'RMSE', fullName: 'Root Mean Squared Error', value: '213.04', unit: 'nuts', position: 2 },
        { label: 'R²', fullName: 'Coefficient of Determination', value: '0.9658', unit: '(96.58%)', position: 3 },
        { label: 'MAPE', fullName: 'Mean Absolute Percentage Error', value: '9.92', unit: '%', position: 4 },
      ]
    }
  };

  const currentModel = models[activeTab];

  const comparisonChart = [
    { metric: 'MAE ↓', 'Random Forest': 106.29, 'LSTM': 315.09, 'Hybrid': 159.57 },
    { metric: 'RMSE ↓', 'Random Forest': 143.41, 'LSTM': 426.78, 'Hybrid': 213.04 },
  ];

  const rocData = [
    { fpr: 0, tpr: 0 },
    { fpr: 0.05, tpr: 0.3 },
    { fpr: 0.1, tpr: 0.6 },
    { fpr: 0.15, tpr: 0.75 },
    { fpr: 0.2, tpr: 0.82 },
    { fpr: 0.3, tpr: 0.88 },
    { fpr: 0.4, tpr: 0.92 },
    { fpr: 0.6, tpr: 0.95 },
    { fpr: 0.8, tpr: 0.98 },
    { fpr: 1, tpr: 1 },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white/95 backdrop-blur-xl shadow-2xl z-[101] transform transition-transform duration-500 ease-out border-l border-emerald-100 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-emerald-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-emerald-600" />
                {t('metrics.title', 'Model Performance')}
              </h2>
              <p className="text-sm text-slate-500 mt-1">{t('metrics.subtitle', 'Regression Models Comparison')}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-emerald-100/50 rounded-full transition-colors text-slate-400 hover:text-emerald-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Model Tabs */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl sticky top-0 z-10">
              {Object.entries(models).map(([key, model]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    activeTab === key
                      ? `bg-gradient-to-r ${model.color} text-white shadow-md`
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{model.name.split(' ')[0]}</span>
                    <span className="text-xs opacity-80">{model.badge}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Current Model Info */}
            <div className={`${currentModel.bgColor} border-2 ${currentModel.borderColor} p-6 rounded-2xl`}>
              <h3 className={`font-bold text-lg ${currentModel.textColor} mb-2`}>{currentModel.name}</h3>
              <p className="text-slate-600 text-sm">{currentModel.description}</p>
            </div>

            {/* Metrics Grid */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Performance Metrics</h4>
              <div className="grid grid-cols-2 gap-3">
                {currentModel.metrics.map((metric, idx) => (
                  <div key={idx} className={`${currentModel.bgColor} border ${currentModel.borderColor} p-4 rounded-2xl group hover:shadow-md transition-all`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-xs font-bold ${currentModel.textColor} uppercase tracking-wider`}>{metric.label}</span>
                        <p className="text-[10px] text-slate-500 mt-1">{metric.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-1">
                      <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                      <span className="text-xs text-slate-500 pb-1">{metric.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metric Explanations */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                Metric Guide
              </h4>
              <div className="text-xs space-y-2 text-slate-600">
                <div><span className="font-mono font-bold text-slate-900">MAE:</span> Mean Absolute Error - Average prediction difference</div>
                <div><span className="font-mono font-bold text-slate-900">RMSE:</span> Root Mean Squared Error - Penalizes larger errors</div>
                <div><span className="font-mono font-bold text-slate-900">R²:</span> Coefficient of Determination - % variance explained (0-1)</div>
                <div><span className="font-mono font-bold text-slate-900">MAPE:</span> Mean Absolute Percentage Error - Average % error</div>
              </div>
              <div className="text-xs text-slate-500 italic border-t border-slate-200 pt-2 mt-2">
                ↓ Lower values better for MAE, RMSE, MAPE • ↑ Higher values better for R²
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                All Models Comparison
              </h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="metric" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="Random Forest" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="LSTM" fill="#a855f7" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Hybrid" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insight */}
            <div className={`bg-gradient-to-br ${currentModel.color} p-6 rounded-3xl text-white shadow-lg`}>
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Why This Model?
              </h4>
              <p className="text-white/90 text-sm leading-relaxed">
                {activeTab === 'rf' && 'Random Forest excels with tabular environmental data. It provides the lowest error rates and highest variance explanation, making it statistically superior for this coconut yield prediction task.'}
                {activeTab === 'lstm' && 'LSTM networks capture temporal patterns and sequential dependencies. While underperforming here, they\'re valuable when time-series trends become available or data structure improves.'}
                {activeTab === 'hybrid' && 'The Hybrid model combines RF\'s stability (60%) with LSTM\'s temporal insights (40%). Recommended for production as it provides ensemble robustness and confidence scoring based on model agreement.'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-emerald-100 bg-slate-50">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModelMetricsSidebar;
