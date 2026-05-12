import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ShieldAlert, Droplets, ThermometerSun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const statusMeta = {
  good: {
    label: 'Good',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    icon: <CheckCircle2 size={18} />,
    accent: 'from-emerald-500 to-lime-400',
  },
  watch: {
    label: 'Watch',
    tone: 'bg-amber-50 text-amber-800 border-amber-100',
    icon: <AlertTriangle size={18} />,
    accent: 'from-amber-500 to-orange-400',
  },
  critical: {
    label: 'Critical',
    tone: 'bg-rose-50 text-rose-800 border-rose-100',
    icon: <ShieldAlert size={18} />,
    accent: 'from-rose-500 to-red-500',
  },
};

const metricIcons = {
  soilMoisture: <Droplets size={16} />,
  temperature: <ThermometerSun size={16} />,
};

const FarmerSummaryCard = ({ summary }) => {
  const { t, i18n } = useTranslation();
  const meta = statusMeta[summary.level] || statusMeta.watch;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur-md"
    >
      <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${meta.accent} mb-5`} />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${meta.tone}`}>
            {meta.icon}
            {t('summary.title')}
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">{meta.label}</h2>
          <p className="mt-2 text-slate-600">{summary.message}</p>
        </div>

        <div className="rounded-2xl bg-slate-900 px-5 py-4 text-white min-w-[220px]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t('summary.action_title')}</p>
          <p className="mt-2 text-lg font-semibold leading-snug">{summary.action}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('summary.yield_title')}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.yieldOutlook}</p>
          <p className="mt-1 text-sm text-slate-600">{summary.yieldNote}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('summary.primary_signal')}</p>
          <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
            {metricIcons[summary.keySignal.type]}
            <span>{summary.keySignal.label}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{summary.keySignal.value}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('summary.language_mode')}</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{i18n.language === 'si' ? 'සිංහල' : i18n.language === 'ta' ? 'தமிழ்' : 'English'}</p>
          <p className="mt-1 text-sm text-slate-600">{t('summary.fallback_note')}</p>
        </div>
      </div>
    </motion.section>
  );
};

export default FarmerSummaryCard;
