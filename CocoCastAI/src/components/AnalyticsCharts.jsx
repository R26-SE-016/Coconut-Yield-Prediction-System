import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useTranslation } from 'react-i18next';
import { mockChartData } from '../data/mockData';

const AnalyticsCharts = ({ trendSeries = [], radarData = [] }) => {
  const { t } = useTranslation();
  const temperatureSeries = trendSeries.length
    ? trendSeries.map((item) => ({ day: item.label, temp: item.temperatureC, humidity: item.humidityPercent, soil: item.soilMoisturePercent, light: item.lightLux }))
    : mockChartData.temperatureTrend.map((item, index) => ({
        day: item.day,
        temp: item.temp,
        humidity: mockChartData.soilMoistureTrend[index]?.moisture ?? null,
        soil: mockChartData.soilMoistureTrend[index]?.moisture ?? null,
        light: null,
      }));

  const radar = radarData.length ? radarData : [
    { subject: t('analytics.temp'), value: 72, fullMark: 100 },
    { subject: 'Humidity', value: 68, fullMark: 100 },
    { subject: 'Soil', value: 74, fullMark: 100 },
    { subject: 'Light', value: 61, fullMark: 100 },
    { subject: 'Connectivity', value: 82, fullMark: 100 },
  ];

  return (
    <section>
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('analytics.title')}</h2>
        <p className="text-slate-600">{t('analytics.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white/90 p-6 rounded-[1.75rem] shadow-sm border border-white/70">
          <h3 className="text-lg font-bold text-slate-900 mb-6">{t('analytics.env_trend')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={temperatureSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.22}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.18)' }}
                  itemStyle={{ color: '#166534', fontWeight: 'bold' }}
                />
                <Legend />
                <Area type="monotone" dataKey="soil" name={t('analytics.soil_moisture')} stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" />
                <Area type="monotone" dataKey="temp" name={t('analytics.temp')} stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/90 p-6 rounded-[1.75rem] shadow-sm border border-white/70">
          <h3 className="text-lg font-bold text-slate-900 mb-6">{t('analytics.radar_title')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="75%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name={t('analytics.health')} dataKey="value" stroke="#14532d" fill="#22c55e" fillOpacity={0.35} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.18)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/90 p-6 rounded-[1.75rem] shadow-sm border border-white/70">
          <h3 className="text-lg font-bold text-slate-900 mb-6">{t('analytics.yield_comp')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData.yieldComparison} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="season" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.18)' }}
                />
                <Bar dataKey="yield" fill="#166534" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/90 p-6 rounded-[1.75rem] shadow-sm border border-white/70">
          <h3 className="text-lg font-bold text-slate-900 mb-6">{t('analytics.ai_feature')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData.featureImportance} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis type="category" dataKey="feature" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.18)' }}
                />
                <Bar dataKey="importance" fill="#84cc16" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsCharts;
