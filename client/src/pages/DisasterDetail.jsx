import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import GISMap from '../components/GISMap';
import { 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  ArrowLeft, 
  Package, 
  Users, 
  HeartHandshake 
} from 'lucide-react';

export default function DisasterDetail() {
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = () => {
    setLoading(true);
    fetch(`/api/disasters/${id}`, {
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
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleToggleStatus = async (newStatus) => {
    try {
      const res = await fetch(`/api/disasters/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const resData = await res.json();
      if (resData.success) {
        fetchDetail();
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-500 font-medium">Loading disaster operation details...</p>
      </div>
    );
  }

  if (!data || !data.disaster) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Incident Not Found</h2>
        <Link to="/disasters" className="text-brand-600 font-semibold hover:underline">
          &larr; Back to all incidents
        </Link>
      </div>
    );
  }

  const { disaster, requests, campaigns } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/disasters"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Disaster Incidents
        </Link>

        {user && hasRole('Authority', 'Admin') && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Incident Status:</span>
            {disaster.status === 'Active' ? (
              <button
                onClick={() => handleToggleStatus('Resolved')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
              >
                Mark as Resolved
              </button>
            ) : (
              <button
                onClick={() => handleToggleStatus('Active')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition"
              >
                Reactivate Incident
              </button>
            )}
          </div>
        )}
      </div>

      {/* Incident Overview Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold text-slate-500">{disaster.id}</span>
              <StatusBadge status={disaster.type} />
              <StatusBadge status={disaster.severity} />
              <StatusBadge status={disaster.status} />
            </div>
            <Link
              to={`/citizen?disaster_id=${disaster.id}`}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              + Submit Relief Request for this Disaster
            </Link>
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {disaster.title}
          </h1>

          <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
            {disaster.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span><strong>Perimeter:</strong> {disaster.affected_area} ({disaster.radius_km} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span><strong>Declared:</strong> {new Date(disaster.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span><strong>Authority:</strong> {disaster.created_by}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 bg-slate-50 border-t border-slate-200 divide-x divide-slate-200 text-center py-4">
          <div>
            <div className="text-2xl font-black text-slate-800">{disaster.request_count || 0}</div>
            <div className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Relief Requests</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{disaster.total_people_affected || 0}</div>
            <div className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Citizens Affected</div>
          </div>
          <div>
            <div className="text-2xl font-black text-brand-600">{campaigns?.length || 0}</div>
            <div className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Active Campaigns</div>
          </div>
        </div>
      </div>

      {/* GIS Map & Associated Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GIS Map with Radius */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" /> Incident Epicenter & Perimeter
          </h2>
          <div className="h-[450px]">
            <GISMap
              disasters={[disaster]}
              requests={requests}
              center={[disaster.latitude, disaster.longitude]}
              zoom={11}
            />
          </div>
        </div>

        {/* Relief Requests Feed for this Disaster */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-600" /> Ground Requests ({requests.length})
            </h2>
            <Link to="/coordinator" className="text-xs text-brand-600 font-semibold hover:underline">
              Go to Coordinator Queue &rarr;
            </Link>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {requests.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                No relief requests registered for this incident yet.
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-600">{req.id}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={req.request_type} />
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {req.citizen_name} — {req.people_affected} people affected
                  </div>
                  <div className="text-xs text-slate-600">{req.description}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {req.address}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
