import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GISMap from '../components/GISMap';
import StatusBadge from '../components/StatusBadge';
import { 
  Map, 
  Radio, 
  AlertTriangle, 
  Package, 
  Layers, 
  CheckCircle2, 
  MapPin, 
  PhoneCall, 
  RefreshCw 
} from 'lucide-react';

export default function GISPortal() {
  const { user, hasRole } = useAuth();
  const [disasters, setDisasters] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Layer visibility toggles
  const [showDisasters, setShowDisasters] = useState(true);
  const [showSOS, setShowSOS] = useState(true);
  const [showRequests, setShowRequests] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [disRes, sosRes, reqRes] = await Promise.all([
        fetch('/api/disasters?status=Active'),
        fetch('/api/sos'),
        fetch('/api/requests/coordinator/queue', {
          headers: user ? { Authorization: `Bearer ${localStorage.getItem('vanguard_token')}` } : {}
        })
      ]);

      const [disData, sosData, reqData] = await Promise.all([
        disRes.json(),
        sosRes.json(),
        reqRes.ok ? reqRes.json() : { requests: [] }
      ]);

      if (disData.success) setDisasters(disData.disasters);
      if (sosData.success) setSosAlerts(sosData.alerts);
      if (reqData.success) setRequests(reqData.requests);
    } catch (err) {
      console.error('GIS fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRespondSOS = async (sosId) => {
    try {
      const res = await fetch(`/api/sos/${sosId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify({ status: 'Responded' })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      alert('Error responding to SOS: ' + err.message);
    }
  };

  const handleResolveSOS = async (sosId) => {
    try {
      const res = await fetch(`/api/sos/${sosId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify({ status: 'Resolved' })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      alert('Error resolving SOS: ' + err.message);
    }
  };

  const activeSosCount = sosAlerts.filter(s => s.status === 'Active').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Map className="w-8 h-8 text-brand-600" />
              GIS Disaster Operations & Tracking
            </h1>
            {activeSosCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white animate-pulse">
                {activeSosCount} LIVE SOS
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            OpenStreetMap live situational awareness, disaster perimeters, relief request pins, and GPS distress beacons (SCRUM-14, SCRUM-30).
          </p>
        </div>

        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
          <Layers className="w-4 h-4" /> Map Layers:
        </span>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDisasters}
            onChange={(e) => setShowDisasters(e.target.checked)}
            className="w-4 h-4 rounded text-brand-600"
          />
          <span>Active Incidents ({disasters.length})</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showSOS}
            onChange={(e) => setShowSOS(e.target.checked)}
            className="w-4 h-4 rounded text-red-600"
          />
          <span className="text-red-600 font-bold">Live SOS Beacons ({sosAlerts.length})</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showRequests}
            onChange={(e) => setShowRequests(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600"
          />
          <span>Ground Relief Requests ({requests.length})</span>
        </label>
      </div>

      {/* Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map */}
        <div className="lg:col-span-2 h-[650px]">
          <GISMap
            disasters={showDisasters ? disasters : []}
            sosAlerts={showSOS ? sosAlerts : []}
            requests={showRequests ? requests : []}
            center={[19.0760, 72.8777]}
            zoom={11}
          />
        </div>

        {/* Live SOS Telemetry & Distress Center Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between max-h-[650px] overflow-hidden">
          <div className="space-y-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-600 animate-ping" />
                Live Distress Center
              </h3>
              <span className="text-xs text-slate-500 font-bold">{sosAlerts.length} total signals</span>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {sosAlerts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No distress signals logged.
                </div>
              ) : (
                sosAlerts.map(sos => (
                  <div
                    key={sos.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 transition ${
                      sos.status === 'Active'
                        ? 'bg-red-50/60 border-red-200'
                        : 'bg-slate-50 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-red-600">{sos.id}</span>
                      <StatusBadge status={sos.status} />
                    </div>

                    <div className="font-bold text-slate-900">
                      {sos.citizen_name}
                    </div>

                    <p className="text-slate-600 italic">"{sos.message}"</p>

                    <div className="space-y-0.5 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <div><strong>Location:</strong> {sos.location_name}</div>
                      <div><strong>GPS:</strong> [{sos.latitude.toFixed(4)}, {sos.longitude.toFixed(4)}]</div>
                      <div className="flex items-center gap-1 text-slate-700 font-semibold">
                        <PhoneCall className="w-3 h-3 text-brand-600" /> {sos.phone}
                      </div>
                    </div>

                    {user && hasRole('Coordinator', 'Authority', 'Admin') && (
                      <div className="pt-2 flex items-center gap-1.5">
                        {sos.status === 'Active' && (
                          <button
                            onClick={() => handleRespondSOS(sos.id)}
                            className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px] transition shadow-sm"
                          >
                            Dispatch Rescue Team
                          </button>
                        )}
                        {sos.status === 'Responded' && (
                          <button
                            onClick={() => handleResolveSOS(sos.id)}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition shadow-sm"
                          >
                            Mark Rescue Resolved
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
