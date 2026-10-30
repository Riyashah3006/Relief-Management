import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Package, 
  Boxes, 
  Truck, 
  Filter, 
  Clock, 
  Users, 
  PlusCircle, 
  ArrowRight,
  ShieldCheck,
  Send
} from 'lucide-react';

export default function CoordinatorPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'allocation' | 'inventory'

  // Queue state
  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [prioritizeTarget, setPrioritizeTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [allocateTarget, setAllocateTarget] = useState(null);

  // Form states
  const [priorityVal, setPriorityVal] = useState('High');
  const [coordinatorNotes, setCoordinatorNotes] = useState('');
  const [approveComments, setApproveComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Inventory & Allocation state
  const [inventory, setInventory] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [allocForm, setAllocForm] = useState({
    resource_id: '',
    quantity: 1,
    volunteer_id: ''
  });

  const fetchQueue = () => {
    setLoadingQueue(true);
    const query = new URLSearchParams({ status: statusFilter });
    fetch(`/api/requests/coordinator/queue?${query.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('vanguard_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setQueue(data.requests);
      })
      .catch(() => {})
      .finally(() => setLoadingQueue(false));
  };

  const fetchInventory = () => {
    fetch('/api/inventory', {
      headers: { Authorization: `Bearer ${localStorage.getItem('vanguard_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInventory(data.items);
          if (data.items.length > 0 && !allocForm.resource_id) {
            setAllocForm(prev => ({ ...prev, resource_id: data.items[0].id }));
          }
        }
      })
      .catch(() => {});
  };

  const fetchVolunteers = () => {
    fetch('/api/volunteers', {
      headers: { Authorization: `Bearer ${localStorage.getItem('vanguard_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVolunteers(data.volunteers);
          if (data.volunteers.length > 0 && !allocForm.volunteer_id) {
            setAllocForm(prev => ({ ...prev, volunteer_id: data.volunteers[0].id }));
          }
        }
      })
      .catch(() => {});
  };

  const fetchAllocations = () => {
    fetch('/api/allocations', {
      headers: { Authorization: `Bearer ${localStorage.getItem('vanguard_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setAllocations(data.allocations);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  useEffect(() => {
    fetchInventory();
    fetchVolunteers();
    fetchAllocations();
  }, []);

  // Action: Prioritize (SCRUM-41 AC2)
  const handlePrioritize = async () => {
    if (!prioritizeTarget) return;
    try {
      const res = await fetch(`/api/requests/${prioritizeTarget.id}/prioritize`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify({
          priority: priorityVal,
          coordinator_notes: coordinatorNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setPrioritizeTarget(null);
        setCoordinatorNotes('');
        fetchQueue();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error prioritizing request: ' + err.message);
    }
  };

  // Action: Approve (SCRUM-42 AC1 & AC3)
  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      const res = await fetch(`/api/requests/${approveTarget.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify({ comments: approveComments })
      });
      const data = await res.json();
      if (data.success) {
        setApproveTarget(null);
        setApproveComments('');
        fetchQueue();
        fetchAllocations();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error approving request: ' + err.message);
    }
  };

  // Action: Reject (SCRUM-42 AC2)
  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      alert('Mandatory rejection reason must be provided.');
      return;
    }

    try {
      const res = await fetch(`/api/requests/${rejectTarget.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify({ rejection_reason: rejectionReason.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setRejectTarget(null);
        setRejectionReason('');
        fetchQueue();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error rejecting request: ' + err.message);
    }
  };

  // Action: Allocate Resource (SCRUM-26)
  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocateTarget) return;

    try {
      const res = await fetch('/api/allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify({
          request_id: allocateTarget.id,
          resource_id: allocForm.resource_id,
          quantity: allocForm.quantity,
          volunteer_id: allocForm.volunteer_id || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setAllocateTarget(null);
        fetchAllocations();
        fetchInventory();
        fetchQueue();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Allocation error: ' + err.message);
    }
  };

  // Action: Update Dispatch Status (SCRUM-26)
  const handleUpdateDeliveryStatus = async (allocId, newStatus) => {
    try {
      const res = await fetch(`/api/allocations/${allocId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchAllocations();
        fetchQueue();
      }
    } catch (err) {
      alert('Error updating allocation status: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Relief Operations & Logistics Hub
          </span>
          <h1 className="text-3xl font-black tracking-tight">Coordinator Command Center</h1>
          <p className="text-sm text-slate-300">
            Triage incoming citizen requests, assign urgency priorities, approve aid, allocate warehouse inventory, and dispatch volunteer delivery missions.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'triage'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Clock className="w-4 h-4" /> Triage & Approval Queue (SCRUM-41, SCRUM-42)
          </button>
          <button
            onClick={() => setActiveTab('allocation')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'allocation'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Truck className="w-4 h-4" /> Resource Allocation & Dispatch (SCRUM-26)
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Boxes className="w-4 h-4" /> Warehouse Inventory (SCRUM-25)
          </button>
        </div>
      </div>

      {/* Tab 1: Triage & Approval Queue (SCRUM-41, SCRUM-42) */}
      {activeTab === 'triage' && (
        <div className="space-y-6">
          {/* Status Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Queue Status:</span>
              <div className="flex flex-wrap gap-1">
                {['All', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Completed'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Sorted by <strong>Urgency weight</strong> & <strong>Submission timestamp</strong> (SCRUM-41 AC3)
            </div>
          </div>

          {loadingQueue ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-slate-500 font-medium">Loading triage queue...</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">Triage Queue Clear!</h3>
              <p className="text-xs text-slate-500">No requests currently pending for "{statusFilter}".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map(req => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700">{req.id}</span>
                      <StatusBadge status={req.status} />
                      <span className="text-xs font-bold text-slate-500">Urgency:</span>
                      <StatusBadge status={req.urgency} />
                      {req.priority && (
                        <>
                          <span className="text-xs font-bold text-amber-700">Priority:</span>
                          <StatusBadge status={req.priority} />
                        </>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {req.request_type} Need — {req.citizen_name} ({req.people_affected} affected)
                    </h3>

                    <p className="text-xs text-slate-600">{req.description || 'No description provided.'}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span><strong>Location:</strong> {req.address}</span>
                      <span><strong>Disaster:</strong> {req.disaster_title || req.disaster_id}</span>
                      <span><strong>Phone:</strong> {req.citizen_phone || req.citizen_phone_record}</span>
                      <span><strong>Submitted:</strong> {new Date(req.created_at).toLocaleString()}</span>
                    </div>

                    {req.coordinator_notes && (
                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
                        <strong>Review Note:</strong> {req.coordinator_notes}
                      </div>
                    )}

                    {req.rejection_reason && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-900 text-xs">
                        <strong>Rejection Reason:</strong> {req.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap lg:flex-col items-end gap-2 flex-shrink-0">
                    {/* Prioritize Action (SCRUM-41 AC2) */}
                    <button
                      onClick={() => {
                        setPrioritizeTarget(req);
                        setPriorityVal(req.priority || 'High');
                        setCoordinatorNotes(req.coordinator_notes || '');
                      }}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      Prioritize / Review (SCRUM-41)
                    </button>

                    {/* Approve Action (SCRUM-42 AC1) */}
                    {req.status !== 'Approved' && req.status !== 'Completed' && (
                      <button
                        onClick={() => {
                          setApproveTarget(req);
                          setApproveComments(req.coordinator_notes || '');
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        Approve Request (SCRUM-42)
                      </button>
                    )}

                    {/* Reject Action (SCRUM-42 AC2) */}
                    {req.status !== 'Rejected' && req.status !== 'Completed' && (
                      <button
                        onClick={() => {
                          setRejectTarget(req);
                          setRejectionReason('');
                        }}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                      >
                        Reject with Reason
                      </button>
                    )}

                    {/* Allocate Resources Action (SCRUM-42 AC3 / SCRUM-26) */}
                    {req.status === 'Approved' && (
                      <button
                        onClick={() => {
                          setAllocateTarget(req);
                          setAllocForm(prev => ({ ...prev, quantity: 1 }));
                        }}
                        className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1"
                      >
                        <Package className="w-3.5 h-3.5" /> Allocate Supplies
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Resource Allocation & Dispatch (SCRUM-26) */}
      {activeTab === 'allocation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Dispatches & Deliveries</h2>
            <span className="text-xs text-slate-500">{allocations.length} total allocations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allocations.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No resources currently allocated. Approve requests to queue allocations.
              </div>
            ) : (
              allocations.map(alloc => (
                <div key={alloc.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500">REQ: {alloc.request_id}</span>
                      <StatusBadge status={alloc.status} />
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{alloc.item_name}</h4>
                    <div className="text-xs font-semibold text-slate-700">
                      Quantity: <span className="text-brand-600 font-bold">{alloc.quantity_allocated} units</span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                      <div><strong>Recipient:</strong> {alloc.citizen_name}</div>
                      <div><strong>Address:</strong> {alloc.address}</div>
                      <div><strong>Volunteer:</strong> {alloc.volunteer_name || 'Unassigned'}</div>
                    </div>
                  </div>

                  {/* Dispatch Transition Controls */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Update Dispatch Status:
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <button
                        onClick={() => handleUpdateDeliveryStatus(alloc.id, 'Dispatched')}
                        className={`py-1 rounded font-bold transition ${alloc.status === 'Dispatched' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        Dispatched
                      </button>
                      <button
                        onClick={() => handleUpdateDeliveryStatus(alloc.id, 'In Transit')}
                        className={`py-1 rounded font-bold transition ${alloc.status === 'In Transit' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        In Transit
                      </button>
                      <button
                        onClick={() => handleUpdateDeliveryStatus(alloc.id, 'Delivered')}
                        className={`py-1 rounded font-bold transition ${alloc.status === 'Delivered' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        Delivered
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Warehouse Inventory (SCRUM-25) */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Relief Supplies Inventory</h2>
              <p className="text-xs text-slate-500">Warehouse stock monitoring & minimum threshold tracking (SCRUM-25, SCRUM-18)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {inventory.map(item => {
              const isLow = item.quantity <= item.min_threshold;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 ${
                    isLow ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                    {isLow && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700 animate-pulse">
                        LOW STOCK
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.item_name}</h4>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">{item.quantity}</span>
                    <span className="text-xs text-slate-500 font-medium">{item.unit}</span>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 space-y-0.5">
                    <div><strong>Warehouse:</strong> {item.warehouse_location}</div>
                    <div><strong>Threshold:</strong> {item.min_threshold} {item.unit}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Prioritize (SCRUM-41) */}
      {prioritizeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Prioritize Request: {prioritizeTarget.id}
            </h3>
            <p className="text-xs text-slate-500">
              Assigning priority will save the triage notes and transition status to <strong>"Under Review"</strong> (SCRUM-41 AC2).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Priority Level
              </label>
              <select
                value={priorityVal}
                onChange={(e) => setPriorityVal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Coordinator Triage Comments
              </label>
              <textarea
                rows="3"
                value={coordinatorNotes}
                onChange={(e) => setCoordinatorNotes(e.target.value)}
                placeholder="Ground assessment verification notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPrioritizeTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePrioritize}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
              >
                Save Priority & Move to Under Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Approve Request (SCRUM-42 AC1) */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Approve Relief Request: {approveTarget.id}
            </h3>
            <p className="text-xs text-slate-500">
              Approving will notify the citizen and advance the request to the <strong>Resource Allocation</strong> queue (SCRUM-42 AC1 & AC3).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Approval Comments (Optional)
              </label>
              <textarea
                rows="3"
                value={approveComments}
                onChange={(e) => setApproveComments(e.target.value)}
                placeholder="e.g. Approved for 10 meal packets and medical trauma kits."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setApproveTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Confirm Approval & Move to Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Request (SCRUM-42 AC2) */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold">
              <XCircle className="w-5 h-5" />
              <h3 className="text-lg">Reject Relief Request: {rejectTarget.id}</h3>
            </div>
            <p className="text-xs text-slate-500">
              A mandatory rejection reason is required to notify the citizen transparently (SCRUM-42 AC2).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Mandatory Rejection Reason *
              </label>
              <textarea
                rows="3"
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Area already serviced by central camp relief team; duplicate request."
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Reject Request & Send Reason
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Allocate Supplies (SCRUM-26) */}
      {allocateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Allocate Warehouse Supplies to {allocateTarget.id}
            </h3>

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Select Warehouse Inventory Item *
                </label>
                <select
                  value={allocForm.resource_id}
                  onChange={(e) => setAllocForm({ ...allocForm, resource_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.item_name} (Avail: {item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Quantity to Allocate *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={allocForm.quantity}
                  onChange={(e) => setAllocForm({ ...allocForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assign Volunteer Delivery Agent (Optional)
                </label>
                <select
                  value={allocForm.volunteer_id}
                  onChange={(e) => setAllocForm({ ...allocForm, volunteer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">-- No Volunteer Assigned Yet --</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.skills}) — {v.availability_status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAllocateTarget(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  Deduct Stock & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
