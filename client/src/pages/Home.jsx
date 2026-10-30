import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { 
  AlertTriangle, 
  MapPin, 
  Users, 
  Package, 
  HeartHandshake, 
  ShieldCheck, 
  ArrowRight, 
  Radio, 
  Sparkles,
  PhoneCall
} from 'lucide-react';

export default function Home() {
  const { user, switchDemoRole } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [activeDisasters, setActiveDisasters] = useState([]);

  useEffect(() => {
    fetch('/api/reports/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAnalytics(data.summary);
      })
      .catch(() => {});

    fetch('/api/disasters?status=Active')
      .then(res => res.json())
      .then(data => {
        if (data.success) setActiveDisasters(data.disasters.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Emergency Banner */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <Radio className="w-4 h-4 animate-ping text-yellow-300" />
            <span>NATIONAL DISASTER RESPONSE PROTOCOL ACTIVE: High Alert across 4 Regions</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 font-mono">
              <PhoneCall className="w-3.5 h-3.5 text-yellow-300" /> Hotline: 1077 / 112
            </span>
            <Link to="/gis" className="underline hover:text-yellow-200 font-bold">
              View Live Distress Map &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-brand-300 text-xs font-semibold backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack Humanitarian Logistics & Rapid Response</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Coordinate Relief, Mobilize Resources, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-300">Save Lives.</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Vanguard Ops delivers real-time disaster incident management, emergency SOS distress beaconing, triage request prioritization, inventory allocation, and volunteer mission dispatch in one unified command center.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/citizen"
                className="px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center gap-2 transition"
              >
                <Package className="w-5 h-5" />
                Submit Relief Request
              </Link>
              <Link
                to="/gis"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-sm border border-white/20 flex items-center gap-2 transition"
              >
                <MapPin className="w-5 h-5 text-brand-400" />
                Live GIS Map
              </Link>
              <Link
                to="/donor"
                className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/25 flex items-center gap-2 transition"
              >
                <HeartHandshake className="w-5 h-5" />
                Contribute Aid
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10">
            <div>
              <div className="text-3xl font-black text-white">
                {analytics?.activeIncidents ?? 4}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Active Incidents</div>
            </div>
            <div>
              <div className="text-3xl font-black text-brand-400">
                {analytics?.totalRequests ?? 12}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Relief Requests</div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-400">
                {analytics?.totalPeopleAffected ? `${analytics.totalPeopleAffected}+` : '150+'}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Citizens Assisted</div>
            </div>
            <div>
              <div className="text-3xl font-black text-amber-400">
                ₹{((analytics?.totalFundsRaised || 2845000) / 100000).toFixed(1)}L
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Aid Mobilized</div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Incidents Ticker */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Active Disaster Incidents
            </h2>
            <p className="text-sm text-slate-500">Live emergency operations requiring immediate attention</p>
          </div>
          <Link
            to="/disasters"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            All Incidents <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeDisasters.map(d => (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500">{d.id}</span>
                  <StatusBadge status={d.severity} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{d.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3">{d.description}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{d.affected_area} (Radius: {d.radius_km} km)</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {d.request_count || 0} Relief Requests
                </span>
                <Link
                  to={`/disasters/${d.id}`}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  View Incident &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6 Roles Testing Card (Quick Evaluation) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-800 shadow-xl">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Role-Based Access Control (SCRUM-36)
            </span>
            <h2 className="text-2xl font-black mt-1">Explore all 6 Operational User Roles</h2>
            <p className="text-sm text-slate-400 mt-2">
              Click any role persona below to instantaneously log in with their pre-configured credentials and explore their authorized dashboards and privileges.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { role: 'Citizen', name: 'Amit Kumar', desc: 'Submit & track requests, SOS panic' },
              { role: 'Coordinator', name: 'Vikram Malhotra', desc: 'Triage, approve & allocate resources' },
              { role: 'Volunteer', name: 'Rohan Verma', desc: 'Accept missions & log deliveries' },
              { role: 'Donor', name: 'Pooja Patel', desc: 'Fund campaigns & instant receipts' },
              { role: 'Authority', name: 'Comm. Deshmukh', desc: 'Declare disasters & alerts' },
              { role: 'Admin', name: 'Dr. R. Sharma', desc: 'RBAC, user control & audit logs' },
            ].map(r => (
              <button
                key={r.role}
                onClick={() => switchDemoRole(r.role)}
                className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-brand-500 text-left transition group flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                    {r.role}
                  </div>
                  <div className="font-semibold text-white text-sm mt-1">{r.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{r.desc}</div>
                </div>
                <div className="mt-4 text-[10px] text-brand-400 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                  Login &rarr;
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
