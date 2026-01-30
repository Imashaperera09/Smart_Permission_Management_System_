import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function LeaveRequestList() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
            .from('LeaveRequests')
            .select('*, LeaveTypes(name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) console.error(error)
        else setRequests(data)
        setLoading(false)
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'text-green-700 bg-green-100/50'
            case 'Rejected': return 'text-rose-700 bg-rose-100/50'
            default: return 'text-amber-700 bg-amber-100/50'
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <span className="text-slate-400 font-medium">Loading history...</span>
            </div>
        </div>
    )

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border-0 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-slate-900 font-display">Request History</h2>
                <span className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full">{requests.length} Total</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Period</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-slate-900 font-bold text-xl">No requests yet</p>
                                        <p className="text-slate-400">Your leave history will appear here once you make a request.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                            <span className="text-base font-bold text-slate-700">{req.LeaveTypes?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-sm font-semibold text-slate-500">
                                            {new Date(req.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(req.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-xl text-xs font-extrabold tracking-wide uppercase ${getStatusStyle(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-sm font-medium text-slate-400">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </span>
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
