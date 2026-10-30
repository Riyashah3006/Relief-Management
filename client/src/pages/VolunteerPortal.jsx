import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { 
  CheckSquare, 
  Clock, 
  MapPin, 
  Award, 
  UserCheck, 
  AlertCircle, 
  Send, 
  CheckCircle2 
} from 'lucide-react';

export default function VolunteerPortal() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Skill registration form
  const [skills, setSkills] = useState('Search & Rescue, First-Aid CPR, Logistics Support');
  const [assignedArea, setAssignedArea] = useState('Kurla Lowlands');
  const [availability, setAvailability] = useState('Available');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Task completion modal
  const [completeTarget, setCompleteTarget] = useState(null);
  const [proofNotes, setProofNotes] = useState('');

  const fetchVolunteerData = () => {
    setLoading(true);
    fetch('/api/volunteers/profile', {
      headers: { Authorization: `Bearer ${localStorage.getItem('vanguard_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.isVolunteer) {
          setProfile(data.volunteer);
          setTasks(data.tasks);
          setSkills(data.volunteer.skills);
          setAssignedArea(data.volunteer.assigned_area || '');
          setAvailability(data.volunteer.availability_status);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVolunteerData();
  }, []);

  const handleRegisterProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg('');

    try {
      const res = await fetch('/api/volunteers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify({
          skills,
          assigned_area: assignedArea,
          availability_status: availability
        })
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg(data.message);
        fetchVolunteerData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error updating volunteer profile: ' + err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus, notes = '') => {
    try {
      const res = await fetch(`/api/volunteers/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vanguard_token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          proof_notes: notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setCompleteTarget(null);
        setProofNotes('');
        fetchVolunteerData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Field Force & Volunteer Operations (SCRUM-27)
          </span>
          <h1 className="text-3xl font-black tracking-tight">Volunteer Mission Command</h1>
          <p className="text-sm text-emerald-100">
            Register specialized skills, receive field delivery missions, and report on-ground relief completions.
          </p>
        </div>

        {profile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-emerald-700/50">
            <div>
              <div className="text-2xl font-black">{profile.tasks_completed || 0}</div>
              <div className="text-[10px] text-emerald-300 uppercase font-semibold">Missions Completed</div>
            </div>
            <div>
              <div className="text-2xl font-black">{profile.availability_status}</div>
              <div className="text-[10px] text-emerald-300 uppercase font-semibold">Deployment Status</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm font-bold truncate">{profile.skills}</div>
              <div className="text-[10px] text-emerald-300 uppercase font-semibold">Certified Skillset</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Volunteer Profile & Skills Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h3>Skill Profile & Deployment</h3>
          </div>

          {profileMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{profileMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegisterProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Relief Skills & Certifications *
              </label>
              <textarea
                rows="3"
                required
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Paramedic, Boat Handling, Heavy Vehicle, Cooking"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Assigned Operational Sector
              </label>
              <input
                type="text"
                value={assignedArea}
                onChange={(e) => setAssignedArea(e.target.value)}
                placeholder="e.g. Dadar Camp #2"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Deployment Availability
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="Available">Available for Immediate Dispatch</option>
                <option value="On Mission">Currently on Field Mission</option>
                <option value="Inactive">Temporarily Off-Duty</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {updatingProfile ? 'Saving...' : 'Update Volunteer Profile'}
            </button>
          </form>
        </div>

        {/* Right: Active Mission Tasks Board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              Assigned Field Missions ({tasks.length})
            </h2>
            <span className="text-xs text-slate-500">Live task queue</span>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-slate-500 font-medium">Loading missions...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No Pending Missions</h3>
              <p className="text-xs text-slate-500">
                You currently have no assigned delivery tasks. Coordinators will dispatch tasks when resources are allocated.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">MISSION #{task.id}</span>
                    <StatusBadge status={task.status} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
                  <p className="text-xs text-slate-600">{task.description}</p>

                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span><strong>Destination:</strong> {task.location}</span>
                  </div>

                  {task.proof_notes && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                      <strong>Delivery Report:</strong> {task.proof_notes}
                    </div>
                  )}

                  {/* Actions */}
                  {task.status !== 'Completed' && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      {task.status === 'Assigned' && (
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, 'In Progress')}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition"
                        >
                          Accept & Begin Mission
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setCompleteTarget(task);
                          setProofNotes('');
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Completed & File Proof
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Task Completion & Proof */}
      {completeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Complete Mission #{completeTarget.id}
            </h3>
            <p className="text-xs text-slate-500">
              Provide on-ground verification or delivery confirmation notes to complete this mission.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Completion Notes / Delivery Proof *
              </label>
              <textarea
                rows="3"
                required
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                placeholder="e.g. Delivered 10 blankets to family at school ground. Signed by head of household."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCompleteTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateTaskStatus(completeTarget.id, 'Completed', proofNotes)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Submit Completion Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
