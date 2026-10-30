import React from 'react';

export default function StatusBadge({ status, type = 'status' }) {
  const getBadgeStyle = () => {
    switch (status?.toLowerCase()) {
      // Relief Request statuses
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under review':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';

      // Severity / Urgency / Priority levels
      case 'critical':
        return 'bg-red-600 text-white font-bold border-red-700 animate-pulse';
      case 'high':
        return 'bg-orange-500 text-white font-semibold border-orange-600';
      case 'medium':
        return 'bg-amber-500 text-white font-medium border-amber-600';
      case 'low':
        return 'bg-emerald-600 text-white font-medium border-emerald-700';

      // Disaster statuses
      case 'active':
        return 'bg-red-100 text-red-800 border-red-300 font-semibold';
      case 'resolved':
        return 'bg-slate-100 text-slate-700 border-slate-300';

      // Allocation statuses
      case 'allocated':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'dispatched':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'in transit':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';

      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${getBadgeStyle()}`}
    >
      {status || 'Unknown'}
    </span>
  );
}
