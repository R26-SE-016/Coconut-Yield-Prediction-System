import React from 'react';
import { ArrowUpRight, History, CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HistoricalComparison = ({ comparisonData = [] }) => {
  const { t } = useTranslation();
  const cards = comparisonData;

  return (
    <section>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('history.title')}</h2>
          <p className="text-slate-600">{t('history.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/90 p-6 rounded-[1.75rem] shadow-sm border border-white/70 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <History size={20} />
            </div>
            <h3 className="text-slate-600 font-medium">{t('history.prev_window')}</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">
              {Number.isFinite(cards[0]?.previous) ? cards[0].previous.toFixed(1) : '—'}
            </span>
            <span className="text-slate-500">{cards[0]?.unit || ''}</span>
          </div>
        </div>

        <div className="bg-[#14532d] p-6 rounded-[1.75rem] shadow-md border border-[#123b24] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CalendarClock size={80} className="text-white" />
          </div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2 bg-white/20 text-white rounded-lg backdrop-blur-sm">
              <CalendarClock size={20} />
            </div>
            <h3 className="text-white/90 font-medium">{t('history.curr_window')}</h3>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-4xl font-bold text-white">
              {Number.isFinite(cards[0]?.current) ? cards[0].current.toFixed(1) : '—'}
            </span>
            <span className="text-white/80">{cards[0]?.unit || ''}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#fefce8] to-[#ecfccb] p-6 rounded-2xl shadow-sm border border-[#bbf7d0] flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-200 text-green-700 rounded-lg">
              <ArrowUpRight size={20} />
            </div>
            <h3 className="text-green-800 font-medium">{t('history.shift')}</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-green-600">{cards[0]?.delta || 'n/a'}</span>
            <span className="text-green-700/80 text-sm leading-tight max-w-[140px]">{t('history.change_note')}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.slice(1).map((card) => (
          <div key={card.label} className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold text-slate-900">{card.label}</h3>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{card.delta}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">{Number.isFinite(card.current) ? card.current.toFixed(1) : '—'}</span>
              <span className="text-slate-500">{card.unit}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{t('history.prev_avg')}: {Number.isFinite(card.previous) ? card.previous.toFixed(1) : '—'} {card.unit}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HistoricalComparison;
