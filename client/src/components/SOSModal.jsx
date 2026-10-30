import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, MapPin, Send, CheckCircle2, X } from 'lucide-react';

export default function SOSModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    citizen_name: user?.name || '',
    phone: user?.phone || '',
    latitude: 19.0657,
    longitude: 72.8790,
    location_name: user?.location || 'Kurla West Lowlands, Mumbai',
    message: 'Urgent rescue needed! Water entering home, seniors stranded.'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(5)),
            longitude: Number(pos.coords.longitude.toFixed(5)),
            location_name: `GPS [${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}]`
          }));
        },
        () => {
          // Fallback location kept
          alert('Could not access GPS device. Defaulted to high-risk disaster coordinates.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sos/panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch SOS signal.');
      }
      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border-4 border-red-500 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg animate-pulse">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-wide">Emergency SOS Beacon</h3>
              <p className="text-xs text-red-100">Direct Distress Signal to Command Center</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900">SOS SIGNAL TRANSMITTED!</h4>
              <p className="text-slate-600 text-sm">
                Beacon ID: <strong className="text-red-600 font-mono text-base">{success.sosId}</strong>
              </p>
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-left text-xs text-red-900 space-y-1">
                <p>• Distress coordinates flagged on live GIS OpenStreetMap.</p>
                <p>• Emergency coordinators and field rescue teams notified.</p>
                <p>• Keep phone lines clear and stay in a high, secure location.</p>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition"
              >
                Close Beacon
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Citizen / Caller Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.citizen_name}
                  onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Emergency Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98200 00000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">
                    Location & Coordinates *
                  </label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Detect Current GPS
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.location_name}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  placeholder="Street / Landmark / Camp"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none mb-2"
                />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    placeholder="Latitude"
                    className="px-2 py-1.5 border border-slate-200 rounded text-slate-600 bg-slate-50"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    placeholder="Longitude"
                    className="px-2 py-1.5 border border-slate-200 rounded text-slate-600 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Immediate Situation / Details
                </label>
                <textarea
                  rows="3"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Number of trapped individuals, rising water level, medical danger..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:from-red-700 hover:to-rose-800 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  {loading ? 'TRANSMITTING BEACON...' : 'DISPATCH DISTRESS SIGNAL NOW'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
