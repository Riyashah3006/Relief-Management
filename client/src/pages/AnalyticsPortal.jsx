import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Boxes, 
  Users, 
  HeartHandshake, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function AnalyticsPortal() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/analytics', {
      headers: user ? { Authorization: `Bearer ${localStorage.getItem('vanguard_token')}` } : {}
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading || !data) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-500 font-medium">Generating operational analytics & reports...</p>
      </div>
    );
  }

  const { summary, charts } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
            Operations Intelligence & Reporting (SCRUM-31)
          </span>
          <h1 className="text-3xl font-black tracking-tight">Relief Management Analytics</h1>
          <p className="text-sm text-slate-300">
            Real-time statistical synthesis of disaster incidents, triage throughput, ground aid allocations, and humanitarian donation fund flows.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Incidents</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{summary.activeIncidents}</div>
          <div className="text-[11px] text-slate-500 mt-1">{summary.totalIncidents} total logged</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Citizens Assisted</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{summary.totalPeopleAffected}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across {summary.totalRequests} relief requests</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Aid Dispatched</span>
            <CheckCircle2 className="w-5 h-5 text-brand-500" />
          </div>
          <div className="text-3xl font-black text-brand-600">
            {summary.approvedRequests + summary.completedRequests}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{summary.underReview} pending in triage queue</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Relief Funds</span>
            <HeartHandshake className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600">
            ₹{summary.totalFundsRaised.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Public & corporate aid pledges</div>
        </div>
      </div>

      {/* Analytics Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Needs Distribution by Request Type */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" /> Relief Demands by Category
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Live Triage Data</span>
          </div>

          <div className="space-y-3 pt-2">
            {charts.byType.map(item => {
              const maxCount = Math.max(...charts.byType.map(t => t.count), 1);
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.request_type} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.request_type}</span>
                    <span className="text-slate-500">{item.count} requests ({item.people} people)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Requests by Urgency Levels */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-600" /> Urgency Level Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Prioritization Index</span>
          </div>

          <div className="space-y-3 pt-2">
            {charts.byUrgency.map(item => {
              const total = summary.totalRequests || 1;
              const pct = Math.round((item.count / total) * 100);
              const color = item.urgency === 'Critical' ? 'bg-red-500' : item.urgency === 'High' ? 'bg-orange-500' : item.urgency === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div key={item.urgency} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.urgency} Urgency</span>
                    <span className="text-slate-500">{item.count} requests ({pct}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse Inventory Stock by Category */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Boxes className="w-5 h-5 text-brand-600" /> Warehouse Inventory Logistics Stockpile
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Threshold Monitoring</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {charts.inventory.map(cat => (
              <div key={cat.category} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">{cat.category}</span>
                <div className="text-2xl font-black text-slate-800">{cat.total_units.toLocaleString()}</div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{cat.item_types} Item SKUs</span>
                  {cat.low_stock_items > 0 ? (
                    <span className="text-red-600 font-bold">{cat.low_stock_items} Low Stock</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Sufficient</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
