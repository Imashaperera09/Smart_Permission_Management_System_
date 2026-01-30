import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function LeaveRequestForm({ onComplete }) {
    const [loading, setLoading] = useState(false)
    const [leaveTypes, setLeaveTypes] = useState([])
    const [formData, setFormData] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: ''
    })

    useEffect(() => {
        fetchLeaveTypes()
    }, [])

    const fetchLeaveTypes = async () => {
        const { data, error } = await supabase.from('LeaveTypes').select('*')
        if (!error) setLeaveTypes(data)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()

        try {
            const response = await fetch('https://localhost:7066/api/LeaveRequest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    leaveTypeId: formData.leave_type_id,
                    startDate: formData.start_date,
                    endDate: formData.end_date,
                    reason: formData.reason,
                    status: 'Pending',
                    createdAt: new Date().toISOString()
                })
            })

            if (response.ok) {
                onComplete()
            } else {
                const error = await response.text()
                alert('Failed to submit: ' + error)
            }
        } catch (err) {
            alert('Error connecting to backend: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-8 font-display">New Request</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Leave Category</label>
                    <select
                        required
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all appearance-none cursor-pointer"
                        value={formData.leave_type_id}
                        onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                    >
                        <option value="">Select category...</option>
                        {leaveTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.name} (Max {t.max_days} days)</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Start Date</label>
                        <input
                            type="date"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">End Date</label>
                        <input
                            type="date"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Reason for Leave</label>
                    <textarea
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none"
                        rows="4"
                        placeholder="Briefly explain the reason..."
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                    {loading ? 'Submitting Request...' : 'Confirm Request'}
                </button>
            </form>
        </div>
    )
}
