import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Users2, Check } from 'lucide-react';

export default function QuickRoleSwitcher() {
  const { user, switchDemoRole } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);
  const [open, setOpen] = useState(false);

  const handleSelectRole = async (roleName) => {
    try {
      setLoadingRole(roleName);
      await switchDemoRole(roleName);
      setOpen(false);
    } catch (err) {
      alert('Failed switching role: ' + err.message);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border border-brand-300 bg-brand-50 text-brand-800 hover:bg-brand-100 transition shadow-sm"
        title="Quick 1-Click Role Switcher for Testing all 6 Roles"
      >
        <Users2 className="w-3.5 h-3.5 text-brand-600" />
        <span>Demo: <strong>{user ? user.role : 'Select Role'}</strong></span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-fade-in text-xs">
            <div className="px-3 py-1.5 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-400">
              Switch Persona (Test All 6 Roles)
            </div>
            {Object.entries(DEMO_USERS).map(([roleKey, data]) => {
              const isCurrent = user?.role === roleKey;
              return (
                <button
                  key={roleKey}
                  disabled={loadingRole !== null}
                  onClick={() => handleSelectRole(roleKey)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                    isCurrent ? 'bg-brand-50 font-bold text-brand-900' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{roleKey}</div>
                    <div className="text-[11px] text-slate-500">{data.label.split('(')[0]}</div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-brand-600" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
