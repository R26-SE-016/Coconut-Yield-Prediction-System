import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Sun, ThermometerSun, Activity } from 'lucide-react';

function getWeatherMode(reading = {}) {
  const temperature = Number.isFinite(reading.temperatureC) ? reading.temperatureC : 0;
  const humidity = Number.isFinite(reading.humidityPercent) ? reading.humidityPercent : 0;
  const soilMoisture = Number.isFinite(reading.soilMoisturePercent) ? reading.soilMoisturePercent : 0;
  const lightLux = Number.isFinite(reading.lightLux) ? reading.lightLux : 0;

  if (typeof humidity === 'number' && humidity >= 88 && typeof soilMoisture === 'number' && soilMoisture >= 58) {
    return {
      name: 'Rainy',
      label: 'Rain feel',
      icon: Droplets,
      gradient: 'from-sky-500 via-cyan-400 to-slate-500',
      accent: 'text-sky-700',
      note: 'Moist air and wet soil are showing a rain-like field mood.',
      rainfall: Math.min(100, Math.round((humidity + soilMoisture) / 2)),
    };
  }

  if (typeof lightLux === 'number' && lightLux >= 850 && typeof temperature === 'number' && temperature >= 31) {
    return {
      name: 'Sunny',
      label: 'Sun feel',
      icon: Sun,
      gradient: 'from-amber-400 via-orange-300 to-lime-400',
      accent: 'text-amber-700',
      note: 'Strong sunlight is lifting the plantation energy level.',
      rainfall: 8,
    };
  }

  if (typeof soilMoisture === 'number' && soilMoisture < 35) {
    return {
      name: 'Dry',
      label: 'Dry feel',
      icon: ThermometerSun,
      gradient: 'from-orange-400 via-amber-300 to-stone-400',
      accent: 'text-orange-700',
      note: 'The field is drying out and needs attention soon.',
      rainfall: 16,
    };
  }

  return {
    name: 'Balanced',
    label: 'Calm feel',
    icon: Activity,
    gradient: 'from-emerald-400 via-lime-300 to-sky-300',
    accent: 'text-emerald-700',
    note: 'The field is balanced and steady, like a mild weather app view.',
    rainfall: 28,
  };
}

function MetricOrb({ Icon, label, value, unit, tone, progress }) {
  const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;
  return (
    <div className="rounded-[1.8rem] border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-3xl font-extrabold ${tone}`}>{value}</span>
            <span className="pb-1 text-sm font-semibold text-slate-500">{unit}</span>
          </div>
        </div>
        <div className={`rounded-2xl p-3 ${tone} bg-white/70`}> 
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(8, safeProgress)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#14532d] via-[#22c55e] to-[#84cc16]"
        />
      </div>
    </div>
  );
}

const RealtimeWeatherPanel = ({ latestReading = {}, connectionState = 'demo' }) => {
  const temperature = Number.isFinite(latestReading.temperatureC) ? latestReading.temperatureC : 0;
  const humidity = Number.isFinite(latestReading.humidityPercent) ? latestReading.humidityPercent : 0;
  const soilMoisture = Number.isFinite(latestReading.soilMoisturePercent) ? latestReading.soilMoisturePercent : 0;
  const lightLux = Number.isFinite(latestReading.lightLux) ? latestReading.lightLux : 0;
  const weather = getWeatherMode(latestReading);
  const WeatherIcon = weather.icon;

  const raindrops = Array.from({ length: 9 }, (_, index) => index);

  return (
    <section className="relative overflow-hidden rounded-[2.4rem] border border-white/70 bg-white/80 p-5 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.5)] backdrop-blur-md">
      <div className={`absolute inset-0 bg-gradient-to-br ${weather.gradient} opacity-10`} />
      <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/70 blur-3xl opacity-60" />
      <div className="absolute -bottom-12 left-8 h-36 w-36 rounded-full bg-[#22c55e]/20 blur-3xl" />

      <div className="relative z-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] bg-slate-950 text-white p-6 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_34%),linear-gradient(135deg,rgba(34,197,94,0.16),transparent_35%)]" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Realtime plantation weather</p>
              <h3 className="mt-2 text-2xl font-bold">{weather.name} field mood</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{weather.note}</p>
            </div>
            <motion.div
              animate={{ rotate: [0, 8, 0], y: [0, -4, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className={`rounded-[1.5rem] p-4 bg-white/10 ring-1 ring-white/10`}
            >
              <WeatherIcon size={34} className="text-white" />
            </motion.div>
          </div>

          <div className="relative z-10 mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sun brightness</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-black">{Math.round(lightLux)}</span>
                <span className="pb-1 text-xs text-slate-400">lux</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  animate={{ width: `${Math.max(10, Math.min(100, Math.round((lightLux || 0) / 10)))}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-lime-300"
                />
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Temperature</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-black">{temperature}</span>
                <span className="pb-1 text-xs text-slate-400">°C</span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/85"
              >
                <ThermometerSun size={14} />
                {connectionState === 'live' ? 'Live' : 'Updating'}
              </motion.div>
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Humidity</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-black">{humidity}</span>
                <span className="pb-1 text-xs text-slate-400">%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  animate={{ width: `${Math.max(12, Math.min(100, humidity || 0))}%` }}
                  transition={{ duration: 0.9 }}
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-300"
                />
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Soil moisture</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-black">{soilMoisture}</span>
                <span className="pb-1 text-xs text-slate-400">%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  animate={{ width: `${Math.max(8, Math.min(100, soilMoisture || 0))}%` }}
                  transition={{ duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-300 to-yellow-200"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`relative min-h-[250px] overflow-hidden rounded-[2rem] bg-gradient-to-br ${weather.gradient} p-6 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)]`}>
            <div className="absolute inset-0 opacity-15">
              {raindrops.map((drop) => (
                <motion.span
                  key={drop}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: [0, 220], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.5 + drop * 0.12, repeat: Infinity, delay: drop * 0.18, ease: 'linear' }}
                  className="absolute h-8 w-0.5 rounded-full bg-white"
                  style={{ left: `${8 + drop * 10}%`, top: `${-10 - (drop % 3) * 8}px` }}
                />
              ))}
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/80">Weather-style realtime view</p>
                  <h4 className="mt-2 text-2xl font-bold">{weather.label}</h4>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="rounded-full bg-white/20 p-4 backdrop-blur-sm"
                >
                  <Activity size={24} />
                </motion.div>
              </div>

              <div>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-black leading-none">{weather.rainfall}</span>
                  <span className="pb-2 text-lg font-semibold text-white/85">% field moisture mood</span>
                </div>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/85">Animated indicators make the dashboard feel live, like a weather app, while still reflecting plantation telemetry.</p>
              </div>
            </div>
          </div>

          <MetricOrb Icon={Droplets} label="Humidity pulse" value={humidity} unit="%" tone="text-sky-700" progress={humidity} />
          <MetricOrb Icon={Droplets} label="Soil freshness" value={soilMoisture} unit="%" tone="text-emerald-700" progress={soilMoisture} />
        </div>
      </div>
    </section>
  );
};

export default RealtimeWeatherPanel;
