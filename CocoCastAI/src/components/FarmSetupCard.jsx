import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Trees, NotebookPen, Layers3 } from 'lucide-react';

const FarmSetupCard = ({ profile, onChange }) => {
  const updateField = (field) => (event) => {
    onChange({ ...profile, [field]: event.target.value });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur-md"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Farm setup</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Plantation profile</h2>
          <p className="mt-1 text-sm text-slate-600">Enter the plantation details so the summary and prediction reflect the real farm.</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 border border-emerald-100">
          Saved locally in this browser
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            <NotebookPen size={14} /> Farm name
          </span>
          <input
            type="text"
            value={profile.farmName}
            onChange={updateField('farmName')}
            placeholder="e.g. Walpola Coconut Farm"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            <Layers3 size={14} /> Block
          </span>
          <input
            type="text"
            value={profile.block}
            onChange={updateField('block')}
            placeholder="e.g. Block A"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            <Trees size={14} /> Tree count
          </span>
          <input
            type="number"
            min="1"
            value={profile.treeCount}
            onChange={updateField('treeCount')}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            <NotebookPen size={14} /> Crop age
          </span>
          <input
            type="number"
            min="0"
            value={profile.cropAge}
            onChange={updateField('cropAge')}
            placeholder="Years"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            <MapPin size={14} /> Location
          </span>
          <input
            type="text"
            value={profile.location}
            onChange={updateField('location')}
            placeholder="e.g. Kurunegala, Sri Lanka"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
        <span className="rounded-full bg-slate-50 px-4 py-2 border border-slate-100">Farm: {profile.farmName || 'Not set'}</span>
        <span className="rounded-full bg-slate-50 px-4 py-2 border border-slate-100">Block: {profile.block || 'Not set'}</span>
        <span className="rounded-full bg-slate-50 px-4 py-2 border border-slate-100">Trees: {profile.treeCount || '0'}</span>
        <span className="rounded-full bg-slate-50 px-4 py-2 border border-slate-100">Crop age: {profile.cropAge || '0'} years</span>
        <span className="rounded-full bg-slate-50 px-4 py-2 border border-slate-100">Location: {profile.location || 'Not set'}</span>
      </div>
    </motion.section>
  );
};

export default FarmSetupCard;
