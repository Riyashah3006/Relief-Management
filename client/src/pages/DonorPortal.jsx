import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { 
  HeartHandshake, 
  DollarSign, 
  Package, 
  Receipt, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function DonorPortal() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Donation Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [formData, setFormData] = useState({
    donor_name: user?.name || '',
    donor_email: user?.email || '',
    type: 'Monetary',
    amount: 5000,
    item_details: '',
    payment_method: 'UPI / NetBanking'
  });
  const [submitting, setSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState('');

  const fetchCampaigns = () => {
    fetch('/api/donations/campaigns')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCampaigns(data.campaigns);
      })
      .catch(() => {});
  };

  const fetchHistory = () => {
    if (!user) return;
    fetch('/api/donations/history', {
      headers: { Authorization: `Bearer ${localStorage.getItem('vanguard_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setHistory(data.donations);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCampaigns();
    if (user) fetchHistory();
    setLoading(false);
  }, [user]);

  const handleOpenDonate = (campaign) => {
    setSelectedCampaign(campaign);
    setReceiptData(null);
    setError('');
    setFormData(prev => ({
      ...prev,
      donor_name: user?.name || '',
      donor_email: user?.email || '',
      type: 'Monetary',
      amount: 5000,
      item_details: ''
    }));
    setModalOpen(true);
  };

  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        campaign_title: selectedCampaign.title
      };

      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user ? `Bearer ${localStorage.getItem('vanguard_token')}` : undefined
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Donation failed');
      }

      setReceiptData(data);
      fetchCampaigns();
      if (user) fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-pink-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
            Humanitarian Aid & Contributions (SCRUM-28)
          </span>
          <h1 className="text-3xl font-black tracking-tight">Disaster Relief Campaigns</h1>
          <p className="text-sm text-rose-100">
            Directly fund emergency medical response, shelter erection, community kitchens, or pledge relief supplies with verifiable digital receipts.
          </p>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Relief Campaigns</h2>
          <span className="text-xs text-slate-500">{campaigns.length} Active appeals</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map(c => {
            const percent = Math.min(100, Math.round((c.raised_amount / c.target_amount) * 100));
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-400">CAMPAIGN #{c.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{c.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3">{c.description}</p>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-rose-600">₹{c.raised_amount.toLocaleString()} Raised</span>
                      <span className="text-slate-500">{percent}% of ₹{c.target_amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDonate(c)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <HeartHandshake className="w-4 h-4" /> Contribute Aid
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donation History Table */}
      {user && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                Donation History & Digital Tax Receipts
              </h3>
              <p className="text-xs text-slate-500">Track and download verifiable contribution certificates</p>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{history.length} contributions logged</span>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No previous donations found under your profile.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Campaign</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Contribution</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-700">{d.receipt_number}</td>
                      <td className="p-3 font-medium text-slate-900">{d.campaign_title}</td>
                      <td className="p-3"><StatusBadge status={d.type} /></td>
                      <td className="p-3 font-bold text-slate-800">
                        {d.type === 'Monetary' ? `₹${d.amount.toLocaleString()}` : d.item_details}
                      </td>
                      <td className="p-3 text-slate-500">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Donate & Instant Receipt */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-600 to-pink-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Aid Contribution Checkout</h3>
                <p className="text-xs text-rose-100">{selectedCampaign?.title}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white hover:text-rose-200">
                ✕
              </button>
            </div>

            <div className="p-6">
              {receiptData ? (
                /* Digital Receipt */
                <div className="space-y-4 text-center py-2">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">DONATION CONFIRMED</h4>
                  <p className="text-xs text-slate-500">Thank you for extending a lifeline in this hour of crisis.</p>

                  <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl text-left text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Receipt No:</span>
                      <strong className="text-slate-900">{receiptData.receiptNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Txn Ref:</span>
                      <span>{receiptData.paymentRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Donor:</span>
                      <span>{receiptData.donor_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount / In-Kind:</span>
                      <strong className="text-emerald-700 text-sm">
                        {receiptData.type === 'Monetary' ? `₹${receiptData.amount.toLocaleString()}` : receiptData.item_details}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Donation Form */
                <form onSubmit={handleSubmitDonation} className="space-y-4">
                  {error && (
                    <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'Monetary' })}
                      className={`py-2 rounded-lg text-xs font-bold border transition ${
                        formData.type === 'Monetary' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Monetary Fund
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'Supplies' })}
                      className={`py-2 rounded-lg text-xs font-bold border transition ${
                        formData.type === 'Supplies' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      In-Kind Supplies
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Donor Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.donor_name}
                      onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Donor Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.donor_email}
                      onChange={(e) => setFormData({ ...formData, donor_email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>

                  {formData.type === 'Monetary' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Donation Amount (INR ₹) *
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {[1000, 5000, 25000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setFormData({ ...formData, amount: amt })}
                            className={`py-1.5 rounded text-xs font-bold border ${formData.amount === amt ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 border-slate-200'}`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="100"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Supplies Description & Quantity *
                      </label>
                      <textarea
                        rows="3"
                        required
                        value={formData.item_details}
                        onChange={(e) => setFormData({ ...formData, item_details: e.target.value })}
                        placeholder="e.g. 200 boxes of bottled water, 50 dry milk formula cans"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      ></textarea>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
                    >
                      {submitting ? 'Processing Payment...' : 'Confirm Contribution & Issue Receipt'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
