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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this leave request?')) return

        const { error } = await supabase
            .from('LeaveRequests')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error deleting request: ' + error.message)
        } else {
            // Optimistic update
            setRequests(requests.filter(req => req.id !== id))
        }
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
                <span className="text-slate-500 font-medium">Loading history...</span>
            </div>
        </div>
    )

    return (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 font-display tracking-tight">Request History</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage and track your previous leave applications</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl">
                    <span className="text-sm font-bold text-slate-600 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">{requests.length} Total</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/30">
                            <th className="px-10 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-[0.2em] font-display">Category</th>
                            <th className="px-10 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-[0.2em] font-display">Period</th>
                            <th className="px-10 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-[0.2em] font-display">Status</th>
                            <th className="px-10 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-[0.2em] font-display">Submission</th>
                            <th className="px-10 py-6 text-right text-xs font-bold text-slate-500 uppercase tracking-[0.2em] font-display"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-10 py-32 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a11 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-900 font-bold text-xl">No requests yet</p>
                                            <p className="text-slate-500 max-w-xs mx-auto">Once you apply for leave, your history and approval status will appear here.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="hover:bg-primary-50/30 transition-all duration-300 group cursor-default border-transparent hover:border-primary-100">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ring-4 ring-offset-4 ring-transparent group-hover:ring-primary-100 transition-all ${req.LeaveTypes?.name.includes('Sick') ? 'bg-rose-400' :
                                                    req.LeaveTypes?.name.includes('Annual') ? 'bg-emerald-400' : 'bg-primary-400'
                                                }`}></div>
                                            <div className="flex flex-col">
                                                <span className="text-lg font-bold text-slate-800 group-hover:text-primary-700 transition-colors capitalize">{req.LeaveTypes?.name.toLowerCase()}</span>
                                                {req.medical_url && (
                                                    <a
                                                        href={req.medical_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 mt-1 transition-colors group/link"
                                                    >
                                                        <svg className="w-3 h-3 group-hover/link:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a11 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                        Medical Attachment
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                                                {new Date(req.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {new Date(req.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-xs font-medium text-slate-500 mt-1">Total {Math.ceil((new Date(req.end_date) - new Date(req.start_date)) / (1000 * 60 * 60 * 24)) + 1} days</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className={`px-5 py-2 rounded-2xl text-xs font-black tracking-widest uppercase inline-flex items-center gap-2 border ${req.status === 'Approved' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                                            req.status === 'Rejected' ? 'text-rose-700 bg-rose-50 border-rose-100' :
                                                'text-amber-700 bg-amber-50 border-amber-100'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${req.status === 'Approved' ? 'bg-emerald-500' :
                                                req.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                                                }`}></span>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-slate-500 group-hover:text-slate-600 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-slate-500 transition-colors">Applied on</span>
                                            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 mt-0.5">{new Date(req.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        {req.status === 'Pending' ? (
                                            <button
                                                onClick={() => handleDelete(req.id)}
                                                className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all group/btn border border-transparent hover:border-rose-100"
                                                title="Cancel Request"
                                            >
                                                <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <div className="w-11 h-11 flex items-center justify-center text-slate-200">
                                                <svg className="w-5 h-5 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                        )}
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
