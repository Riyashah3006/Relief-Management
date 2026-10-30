import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { 
  AlertTriangle, 
  PlusCircle, 
  Filter, 
  MapPin, 
  Calendar, 
  Radio, 
  X, 
  CheckCircle2, 
  Package, 
  Users 
} from 'lucide-react';

export default function Disasters() {
  const { user, hasRole } = useAuth();
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters (SCRUM-38 AC2)
  const [typeFilter, setTypeFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active');

  // Modal for Create Disaster (SCRUM-37)
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Flood',
    severity: 'High',
    latitude: 19.0760,
    longitude: 72.8777,
    radius_km: 15,
    affected_area: '',
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisasters = () => {
    setLoading(true);
    const query = new URLSearchParams({
      type: typeFilter,
      severity: severityFilter,
      status: statusFilter
    });

    fetch(`/api/disasters?${query.toString()}`, {
      headers: user ? { Authorization: `Bearer ${localStorage.getItem('vanguard_token')}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDisasters(data.disasters);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDisasters();
  }, [typeFilter, severityFilter, statusFilter]);

  const handleCreateDisaster = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await fetch('/api/disasters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create incident.');
      }

      setFormSuccess(data.message);
      setTimeout(() => {
        setModalOpen(false);
        setFormSuccess('');
        setFormData({
          title: '',
          type: 'Flood',
          severity: 'High',
          latitude: 19.0760,
          longitude: 72.8777,
          radius_km: 15,
          affected_area: '',
          description: ''
        });
        fetchDisasters();
      }, 1500);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Disaster Incidents</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
              {disasters.length} Recorded
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time incident declaration, perimeter monitoring, and response coordination (SCRUM-37, SCRUM-38)
          </p>
        </div>

        {/* Declare Incident Button (SCRUM-37: Authority & Admin) */}
        {user && hasRole('Authority', 'Admin') && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-500/20 transition"
          >
            <PlusCircle className="w-5 h-5" />
            Declare Disaster Incident
          </button>
        )}
      </div>

      {/* Filter Bar (SCRUM-38 AC2) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
        <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-4 h-4" /> Filters:
        </div>

        <div className="flex items-center gap-2">
          <span>Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="Flood">Flood</option>
            <option value="Earthquake">Earthquake</option>
            <option value="Cyclone">Cyclone</option>
            <option value="Landslide">Landslide</option>
            <option value="Fire">Fire</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span>Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none"
          >
            <option value="Active">Active Only</option>
            <option value="Resolved">Resolved</option>
            <option value="All">All Incidents</option>
          </select>
        </div>
      </div>

      {/* Disaster Incidents Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 font-medium">Loading disaster operations...</p>
        </div>
      ) : disasters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Disaster Incidents Found</h3>
          <p className="text-xs text-slate-500">No incidents match the selected filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {disasters.map(d => (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-500">{d.id}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.type} />
                    <StatusBadge status={d.severity} />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 leading-snug">{d.title}</h3>

                <p className="text-xs text-slate-600 line-clamp-3">{d.description}</p>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span><strong>Area:</strong> {d.affected_area} ({d.radius_km} km radius)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span><strong>Declared:</strong> {new Date(d.created_at).toLocaleDateString()} by {d.created_by}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800">{d.request_count || 0}</div>
                    <div className="text-[10px] text-slate-500">Total Requests</div>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <div className="font-bold text-emerald-700">{d.approved_count || 0}</div>
                    <div className="text-[10px] text-emerald-600">Approved Aid</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/disasters/${d.id}`}
                  className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition"
                >
                  View Details & Relief Feed &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Disaster Incident (SCRUM-37) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Declare New Disaster Incident (SCRUM-37)</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white hover:text-red-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {formError && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleCreateDisaster} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Incident Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Pune Flash Floods & Dam Breach"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Disaster Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="Flood">Flood</option>
                      <option value="Earthquake">Earthquake</option>
                      <option value="Cyclone">Cyclone</option>
                      <option value="Landslide">Landslide</option>
                      <option value="Fire">Fire</option>
                      <option value="Drought">Drought</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Severity Level *
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="Critical">Critical (Immediate Evacuation)</option>
                      <option value="High">High (Major Disruption)</option>
                      <option value="Medium">Medium (Precautionary Alert)</option>
                      <option value="Low">Low (Localized Advisory)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Affected Area / Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.affected_area}
                    onChange={(e) => setFormData({ ...formData, affected_area: e.target.value })}
                    placeholder="e.g. Haveli, Shivajinagar & Mula River Basin"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Radius (km)
                    </label>
                    <input
                      type="number"
                      value={formData.radius_km}
                      onChange={(e) => setFormData({ ...formData, radius_km: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Operational Description & Directives *
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details about situation, required relief materials, camp sites..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    {submitting ? 'Broadcasting Incident...' : 'Declare Incident & Notify Coordinators'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
