import React from 'react';
import { motion } from 'framer-motion';
import { ThermometerSun, Droplets, Droplet, Sun, Wifi, Activity, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SensorDashboard = ({ snapshotCards = [], systemSummary, alerts = [], connectionState, latestReading, isOffline }) => {
  const { t } = useTranslation();
  
  const sensors = snapshotCards.slice(0, 4).map((card) => {
    const iconMap = {
      Temperature: <ThermometerSun size={28} />,
      Humidity: <Droplets size={28} />,
      'Soil Moisture': <Droplet size={28} />,
      Light: <Sun size={28} />,
    };

    const colorClass = card.accent || 'from-slate-500/20 to-slate-200/20';
    const ringClass = card.ring || 'text-slate-600';

    const value = card.value;
    const progress = typeof value === 'number' && Number.isFinite(value)
      ? Math.max(0, Math.min(100, value))
      : 0;

    return {
      ...card,
      icon: iconMap[card.title] || <Activity size={28} />,
      status: card.note,
      progress,
      color: `bg-gradient-to-br ${colorClass} ${ringClass}`,
      progressColor: ringClass.includes('emerald')
        ? 'bg-emerald-500'
        : ringClass.includes('sky')
          ? 'bg-sky-500'
          : ringClass.includes('orange')
            ? 'bg-orange-500'
            : 'bg-amber-500',
    };
  });

  const connectionBadge = isOffline
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : connectionState === 'live'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('sensors.title')}</h2>
          <p className="text-slate-600">{t('sensors.subtitle')}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${connectionBadge}`}>
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
              isOffline ? 'bg-amber-400' : connectionState === 'live' ? 'bg-emerald-400' : 'bg-rose-400'
            } opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              isOffline ? 'bg-amber-500' : connectionState === 'live' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}></span>
          </span>
          {isOffline ? '📡 Cached Data' : connectionState === 'live' ? t('sensors.online') : connectionState === 'demo' ? 'Demo Mode' : 'Connection unstable'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {sensors.map((sensor, index) => (
          <motion.div
            key={sensor.title}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white/90 backdrop-blur-md rounded-[1.75rem] p-6 shadow-sm border border-white/70 hover:shadow-md transition-all relative overflow-hidden group"
          >
              <div className={`absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full -mr-10 -mt-10 ${sensor.color?.split(' ')[0] || 'bg-slate-300'}`}></div>
            
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${sensor.color || 'bg-slate-100 text-slate-600'}`}>
                {sensor.icon}
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {sensor.status}
              </span>
            </div>
            
            <h3 className="text-slate-500 text-sm font-medium mb-1">{t(`sensors.${sensor.title.toLowerCase().replace(' ', '_')}`, sensor.title)}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-slate-900">{sensor.value}</span>
              <span className="text-lg text-slate-500 font-medium">{sensor.unit}</span>
            </div>
            
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${sensor.progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`${sensor.progressColor} h-1.5 rounded-full`}
              ></motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-[1.75rem] border border-white/70 bg-slate-900 text-white p-6 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t('sensors.command_center')}</p>
              <h3 className="text-xl font-bold mt-2">{t('sensors.system_health')}</h3>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold">{systemSummary?.deviceState || 'Active'}</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-slate-400">{t('sensors.mode')}</p>
              <p className="mt-2 text-lg font-semibold">{systemSummary?.sleepState || t('sensors.deep_sleep')}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-slate-400">{t('sensors.interval')}</p>
              <p className="mt-2 text-lg font-semibold">{systemSummary?.intervalMinutes ? `${systemSummary.intervalMinutes} min` : '—'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-slate-400">{t('sensors.ip_address', 'IP address')}</p>
              <p className="mt-2 text-lg font-semibold break-all">{systemSummary?.ipAddress || '—'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-slate-400">{t('sensors.records')}</p>
              <p className="mt-2 text-lg font-semibold">{systemSummary?.recordCount ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-rose-700 font-semibold mb-3">
            <AlertTriangle size={18} />
            {t('alerts.title')}
          </div>
          {alerts.length ? (
            <ul className="space-y-3 text-sm text-slate-700">
              {alerts.map((alert) => (
                <li key={alert} className="rounded-2xl bg-rose-50 border border-rose-100 p-3 leading-relaxed">
                  {alert}
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
              {t('alerts.no_alerts')}
            </div>
          )}
          <div className="mt-4 text-xs text-slate-500">
            {t('alerts.source')}: {latestReading?.timestamp || systemSummary?.lastSync || 'Waiting...'}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SensorDashboard;
