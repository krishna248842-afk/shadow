'use client';
import { useState } from 'react';
import { Building2, AlertTriangle, Loader2, Trash2, CheckCircle2, Globe } from 'lucide-react';
import { saveSettings, resetStoreData } from '@/lib/actions';
import type { SettingKey } from '@/lib/settings';

export default function SettingsClient({ settings: s }: { settings: Record<SettingKey, string> }) {
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <p className="section-title">Settings</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Business <span className="gradient-text">Profile</span></h1>
        <p className="mt-1 text-xs text-zinc-500">Used by the AI in every caption, reply and brief — fill this honestly, it sells for you.</p>
      </div>

      <form action={async (fd) => { await saveSettings(fd); setSaved(true); setTimeout(() => setSaved(false), 2500); }} className="card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2 flex items-center gap-2 border-b border-line pb-3">
          <Building2 size={16} className="text-violet-300" />
          <p className="text-[12px] font-bold text-zinc-200">Store identity</p>
        </div>
        <Field label="Business name" name="business_name" defaultValue={s.business_name} placeholder="Shadow Trends Patna" />
        <Field label="WhatsApp / phone" name="business_phone" defaultValue={s.business_phone} placeholder="98XXXXXXXX" />
        <Field label="City / service area" name="business_city" defaultValue={s.business_city} placeholder="Patna, Bihar" />
        <Field label="GST number (optional)" name="business_gst" defaultValue={s.business_gst} placeholder="22AAAAA0000A1Z5" />
        <Field label="Default margin over Meesho price %" name="default_margin_pct" defaultValue={s.default_margin_pct || '45'} placeholder="45" type="number" />
        <div>
          <label className="label">Content language</label>
          <select name="content_language" defaultValue={s.content_language || 'hinglish'} className="input">
            <option value="hinglish">Hinglish (Hindi + English) — recommended</option>
            <option value="hindi">Hindi (Devanagari)</option>
            <option value="english">English</option>
          </select>
        </div>

        <div className="sm:col-span-2 mt-1 flex items-center gap-2 border-b border-line pb-3">
          <Globe size={16} className="text-lime-400" />
          <p className="text-[12px] font-bold text-zinc-200">Payout details (shown only to you — for withdrawals & records)</p>
        </div>
        <Field label="UPI ID" name="business_upi" defaultValue={s.business_upi} placeholder="name@okhdfcbank" mono />
        <Field label="Bank A/C + IFSC" name="business_bank" defaultValue={s.business_bank} placeholder="A/C … · IFSC …" mono />

        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary">{saved ? <><CheckCircle2 size={16} /> Saved!</> : 'Save profile'}</button>
          <p className="text-[10px] text-zinc-600">AI API keys live in <a href="/connectors" className="text-violet-300 underline">Connectors</a>, not here.</p>
        </div>
      </form>

      {/* Danger zone */}
      <div className="card border-red-900/40 p-5">
        <p className="section-title flex items-center gap-2 !text-red-400/80"><AlertTriangle size={13} /> Danger zone</p>
        <p className="mt-1.5 text-[11px] text-zinc-500">Wipes ALL products, orders, posts, campaigns, interactions, wallet history and withdrawals. Keeps your connected keys and business profile. Export CSV first if you need records.</p>
        <button
          className="btn-danger mt-3 !py-2 text-[11px]"
          disabled={resetting}
          onClick={async () => {
            if (!confirm('Really wipe ALL store data? This cannot be undone.')) return;
            if (!confirm('Second check — orders, products, wallet, everything goes. Continue?')) return;
            setResetting(true);
            await resetStoreData();
            setResetting(false);
            window.location.href = '/';
          }}
        >
          {resetting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Reset store data
        </button>
      </div>
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder, type = 'text', mono = false }: { label: string; name: string; defaultValue?: string; placeholder?: string; type?: string; mono?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ''} placeholder={placeholder} className={`input ${mono ? 'font-mono text-[11px]' : ''}`} autoComplete="off" />
    </div>
  );
}
