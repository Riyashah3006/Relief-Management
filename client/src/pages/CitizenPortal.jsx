import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { 
  Package, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  MapPin, 
  AlertCircle, 
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function CitizenPortal() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultDisasterId = searchParams.get('disaster_id') || '';

  const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'history'
  const [disasters, setDisasters] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Submit form state (SCRUM-39)
  const [formData, setFormData] = useState({
    disaster_id: defaultDisasterId,
    request_type: 'Food',
    urgency: 'High',
    people_affected: 4,
    address: user?.location || '',
    latitude: 19.0657,
    longitude: 72.8790,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Fetch active disasters for dropdown
  useEffect(() => {
    fetch('/api/disasters?status=Active', {
      headers: { Authorization: `Bearer ${localStorage.getItem('vanguard_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.disasters.length > 0) {
          setDisasters(data.disasters);
          if (!formData.disaster_id) {
            setFormData(prev => ({ ...prev, disaster_id: data.disasters[0].id }));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch My Requests (SCRUM-40)
  const fetchMyRequests = () => {
    setLoadingHistory(true);
    const query = new URLSearchParams({ status: statusFilter });
    fetch(`/api/requests/my?${query.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('vanguard_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMyRequests(data.requests);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMyRequests();
    }
  }, [activeTab, statusFilter]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Submission failed');
      }

      setSubmitSuccess(data);
      // Reset form description
      setFormData(prev => ({ ...prev, description: '' }));
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-200">
            Citizen Assistance Portal
          </span>
          <h1 className="text-3xl font-black tracking-tight">Relief Request Management</h1>
          <p className="text-sm text-brand-100">
            Submit critical needs during active disasters and monitor progress through triage, approval, and resource delivery.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6 pt-6 border-t border-brand-500/50">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'submit'
                ? 'bg-white text-brand-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Package className="w-4 h-4" /> Submit Relief Request (SCRUM-39)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-brand-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Clock className="w-4 h-4" /> My Relief Requests (SCRUM-40)
          </button>
        </div>
      </div>

      {/* Tab 1: Submit Relief Request (SCRUM-39) */}
      {activeTab === 'submit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Relief Assistance Request Form</h2>
            <p className="text-xs text-slate-500">
              Please specify the disaster incident, essential needs, location, and urgency level.
            </p>
          </div>

          {submitError && (
            <div className="p-3 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-5 mb-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>REQUEST SUBMITTED WITH UNIQUE ID: {submitSuccess.requestId}</span>
              </div>
              <p className="text-xs text-emerald-700">
                {submitSuccess.message} Our relief coordinators have received your alert and will review priority levels.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                >
                  Track in "My Requests" &rarr;
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="space-y-5">
            {/* Disaster Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Active Disaster Incident *
              </label>
              <select
                required
                value={formData.disaster_id}
                onChange={(e) => setFormData({ ...formData, disaster_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {disasters.map(d => (
                  <option key={d.id} value={d.id}>
                    [{d.id}] {d.title} ({d.severity}) — {d.affected_area}
                  </option>
                ))}
              </select>
            </div>

            {/* Request Type & Urgency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Primary Relief Need *
                </label>
                <select
                  value={formData.request_type}
                  onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Food">Food & Potable Drinking Water</option>
                  <option value="Shelter">Shelter & Emergency Bedding/Tents</option>
                  <option value="Medical">Medical, First-Aid & Trauma Care</option>
                  <option value="Clothing">Clothing & Child Warm Packs</option>
                  <option value="Rescue">Evacuation & Boat Rescue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Urgency Level *
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Critical">Critical (Immediate Life-Threatening Danger)</option>
                  <option value="High">High (Severe Shortage / Vulnerable Family)</option>
                  <option value="Medium">Medium (Impending Need within 24h)</option>
                  <option value="Low">Low (Replenishment / Non-Urgent)</option>
                </select>
              </div>
            </div>

            {/* People affected */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Number of Affected People *
              </label>
              <input
                type="number"
                min="1"
                max="500"
                required
                value={formData.people_affected}
                onChange={(e) => setFormData({ ...formData, people_affected: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            {/* Location Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Exact Location / Chawl / Building / Landmark *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Room 14, Bail Bazar, Kurla West Lowlands"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Situation Details & Specific Requirements
              </label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Specify if infants, pregnant women, elderly, medical prescriptions needed..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting Request...' : 'Submit Relief Request Now'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: My Relief Requests (SCRUM-40) */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Status Filter Bar (SCRUM-40 AC2) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filter Status:</span>
              <div className="flex flex-wrap gap-1">
                {['All', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Completed'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      statusFilter === st
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {myRequests.length} requests
            </span>
          </div>

          {loadingHistory ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-slate-500 font-medium">Loading your relief requests...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No Relief Requests Found</h3>
              <p className="text-xs text-slate-500">
                You have not submitted any relief requests matching "{statusFilter}".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRequests.map(req => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-brand-300 cursor-pointer transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-600">{req.id}</span>
                      <StatusBadge status={req.status} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
                      <span>{req.request_type} Assistance</span>
                      <StatusBadge status={req.urgency} />
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2">{req.description || 'No additional notes provided.'}</p>

                    <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{req.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Submitted on {new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-600">
                    <span>View Timeline & Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Request Detail & Timeline (SCRUM-40 AC3) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-brand-400">{selectedRequest.id}</span>
                <h3 className="text-lg font-bold">{selectedRequest.request_type} Assistance Request</h3>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-white hover:text-slate-300">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Current Status:</span>
                  <div className="mt-1"><StatusBadge status={selectedRequest.status} /></div>
                </div>
                <div>
                  <span className="text-slate-500">Assigned Priority:</span>
                  <div className="mt-1"><StatusBadge status={selectedRequest.priority || selectedRequest.urgency} /></div>
                </div>
                <div>
                  <span className="text-slate-500">People:</span>
                  <div className="font-bold text-sm text-slate-800 mt-1">{selectedRequest.people_affected}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <div className="font-semibold text-slate-700">Location:</div>
                <div className="text-slate-600">{selectedRequest.address}</div>
              </div>

              {selectedRequest.coordinator_notes && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                  <div className="font-bold">Coordinator Notes:</div>
                  <div>{selectedRequest.coordinator_notes}</div>
                </div>
              )}

              {selectedRequest.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1">
                  <div className="font-bold">Rejection Reason:</div>
                  <div>{selectedRequest.rejection_reason}</div>
                </div>
              )}

              {/* Allocated Resources */}
              <div className="pt-2">
                <div className="font-bold text-slate-800 mb-2">Assigned & Allocated Resources:</div>
                {selectedRequest.allocations && selectedRequest.allocations.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRequest.allocations.map(alloc => (
                      <div key={alloc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{alloc.item_name}</div>
                          <div className="text-[11px] text-slate-500">Quantity: {alloc.quantity_allocated} units</div>
                          {alloc.volunteer_name && (
                            <div className="text-[10px] text-brand-600">Volunteer: {alloc.volunteer_name} ({alloc.volunteer_phone})</div>
                          )}
                        </div>
                        <StatusBadge status={alloc.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                    Resources have not yet been assigned to this request.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
