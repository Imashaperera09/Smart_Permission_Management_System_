import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ManagerApprovalList() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPendingRequests()
    }, [])

    const fetchPendingRequests = async () => {
        try {
            const response = await fetch('https://localhost:7066/api/LeaveRequest/all')
            if (response.ok) {
                const data = await response.json()
                setRequests(data)
            }
        } catch (err) {
            console.error('Error fetching requests:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id, action) => {
        try {
            const response = await fetch(`https://localhost:7066/api/LeaveRequest/${action}/${id}`, {
                method: 'POST'
            })
            if (response.ok) {
                fetchPendingRequests()
            } else {
                alert(`Failed to ${action} request.`)
            }
        } catch (err) {
            alert(`Error connecting to backend: ${err.message}`)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <span className="text-slate-400 font-medium">Fetching pending tasks...</span>
            </div>
        </div>
    )

    const pendingRequests = requests.filter(r => r.status === 'Pending')

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border-0 overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-primary-50/30 flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-slate-900 font-display">Pending Approvals</h2>
                <span className="text-sm font-bold text-primary-600 bg-white border border-primary-100 px-4 py-1.5 rounded-full shadow-sm">{pendingRequests.length} Waiting</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Reason</th>
                            <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {pendingRequests.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                        <p className="text-slate-900 font-bold text-xl">All caught up!</p>
                                        <p className="text-slate-400">There are no pending leave requests to review.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            pendingRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xs">
                                                {req.userId.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 leading-none mb-1">User ID: {req.userId.substring(0, 8)}</span>
                                                <span className="text-xs font-medium text-slate-400">ID: ...{req.userId.substring(28)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">
                                                {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs font-medium text-slate-400">{(new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24) + 1} Days total</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-medium text-slate-500 max-w-xs truncate italic">"{req.reason || 'No reason provided'}"</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleAction(req.id, 'approve')}
                                                className="bg-green-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-green-500/20 hover:bg-green-700 hover:shadow-green-500/30 transition-all active:scale-95 cursor-pointer"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'reject')}
                                                className="bg-rose-100 text-rose-600 px-5 py-2 rounded-xl text-xs font-bold hover:bg-rose-200 transition-all active:scale-95 cursor-pointer"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
