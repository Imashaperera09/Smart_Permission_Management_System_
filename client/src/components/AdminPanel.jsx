import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminPanel() {
    const [users, setUsers] = useState([])
    const [leaveTypes, setLeaveTypes] = useState([])
    const [requests, setRequests] = useState([])
    const [medicals, setMedicals] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState('overview')
    const [actionLoading, setActionLoading] = useState(null)
    const [requestFilter, setRequestFilter] = useState('All')

    useEffect(() => {
        fetchAdminData()
    }, [])

    const fetchAdminData = async () => {
        setLoading(true)

        // Fetch all necessary data
        const { data: profiles } = await supabase.from('Profiles').select('*, Roles(name)')
        const { data: types } = await supabase.from('LeaveTypes').select('*')

        const { data: reqs } = await supabase.from('LeaveRequests')
            .select('*, LeaveTypes(name), Profiles(full_name)')
            .order('created_at', { ascending: false })

        const { data: docs } = await supabase.from('MedicalDocuments')
            .select('*, Profiles(full_name)')
            .order('created_at', { ascending: false })

        if (profiles) setUsers(profiles)
        if (types) setLeaveTypes(types)
        if (reqs) setRequests(reqs)
        if (docs) setMedicals(docs)

        setLoading(false)
    }

    const handleRequestAction = async (request, newStatus) => {
        setActionLoading(request.id)

        // 1. Update Request Status
        const { error: statusError } = await supabase
            .from('LeaveRequests')
            .update({ status: newStatus })
            .eq('id', request.id)

        if (statusError) {
            alert(statusError.message)
            setActionLoading(null)
            return
        }

        // 2. If Approved, Deduct Balance
        if (newStatus === 'Approved') {
            const start = new Date(request.start_date)
            const end = new Date(request.end_date)
            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1

            // Get current balance
            const { data: profile } = await supabase.from('Profiles').select('leave_balance').eq('id', request.user_id).single()

            if (profile) {
                const newBalance = (profile.leave_balance || 30) - diffDays
                await supabase.from('Profiles').update({ leave_balance: newBalance }).eq('id', request.user_id)
            }
        }

        await fetchAdminData()
        setActionLoading(null)

    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Initializing Admin Workspace...</p>
        </div>
    )

    const handleUpdatePolicy = async (typeId, currentMax) => {
        const newMax = prompt('Enter new maximum days for this leave type:', currentMax)
        if (newMax === null || isNaN(newMax)) return

        setActionLoading(typeId)
        const { error } = await supabase
            .from('LeaveTypes')
            .update({ max_days: parseInt(newMax) })
            .eq('id', typeId)

        if (error) alert(error.message)
        else fetchAdminData()
        setActionLoading(null)
    }

    const handleDeletePolicy = async (typeId) => {
        if (!confirm('Are you sure you want to delete this leave type? This may affect existing requests.')) return

        setActionLoading(typeId)
        const { error } = await supabase.from('LeaveTypes').delete().eq('id', typeId)

        if (error) alert(error.message)
        else fetchAdminData()
        setActionLoading(null)
    }

    const handleAddType = async () => {
        const name = prompt('Enter name for the new leave type:')
        if (!name) return
        const max = prompt('Enter maximum days allocation:')
        if (!max || isNaN(max)) return

        const { error } = await supabase.from('LeaveTypes').insert({
            name,
            max_days: parseInt(max)
        })

        if (error) alert(error.message)
        else fetchAdminData()
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Sidebar Navigation */}
            <div className="lg:w-72 space-y-2">
                <div className="p-6 bg-slate-900 rounded-[2.5rem] mb-6 text-white shadow-2xl shadow-slate-900/20">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Security Level</p>
                    <p className="text-xl font-black">Full Administrator</p>
                </div>

                {[
                    { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                    { id: 'requests', label: 'Leave Requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                    { id: 'users', label: 'User Directory', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                    { id: 'medicals', label: 'Medical Archive', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                    { id: 'leaves', label: 'Leave Policies', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeSection === tab.id ? 'bg-white shadow-xl text-primary-600' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path></svg>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 min-h-[700px]">
                {/* OVERVIEW SECTION */}
                {activeSection === 'overview' && (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        <header>
                            <h2 className="text-4xl font-black text-slate-900 mb-2 font-display">System Overview</h2>
                            <p className="text-slate-500 font-medium text-lg">Quick glance at your organization's health.</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Staff', value: users.length, color: 'blue', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                                { label: 'Pending Reqs', value: requests.filter(r => r.status === 'Pending').length, color: 'amber', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { label: 'Approved Today', value: requests.filter(r => r.status === 'Approved').length, color: 'emerald', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { label: 'Documents', value: medicals.length, color: 'primary', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                            ].map((stat, i) => (
                                <div key={i} className={`p-8 bg-${stat.color}-50 rounded-[2.5rem] border border-${stat.color}-100`}>
                                    <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center text-${stat.color}-600 shadow-sm mb-4`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon}></path></svg>
                                    </div>
                                    <span className={`text-${stat.color}-600 font-bold block mb-1 uppercase tracking-widest text-[10px]`}>{stat.label}</span>
                                    <span className="text-4xl font-black text-slate-900">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* LEAVE REQUESTS SECTION */}
                {activeSection === 'requests' && (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <header className="flex justify-between items-end">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 font-display">Manage Requests</h2>
                                <p className="text-slate-500 font-medium">Approve or reject employee leave applications.</p>
                            </div>
                            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                                <button
                                    onClick={() => setRequestFilter('All')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${requestFilter === 'All' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setRequestFilter('Pending')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${requestFilter === 'Pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    Pending
                                </button>
                            </div>
                        </header>

                        <div className="space-y-4">
                            {requests.filter(r => requestFilter === 'All' ? true : r.status === 'Pending').map(req => (
                                <div key={req.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center group hover:bg-white hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500">
                                    <div className="flex gap-6 items-center">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Day</span>
                                            <span className="text-2xl font-black text-slate-900">{new Date(req.start_date).getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-xl">{req.Profiles?.full_name || 'Staff Member'}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">{req.user_id}</p>
                                            <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                                <span className="text-primary-600">{req.LeaveTypes?.name}</span>
                                                •
                                                <span>{new Date(req.start_date).toLocaleDateString()} to {new Date(req.end_date).toLocaleDateString()}</span>
                                            </p>
                                            <p className="text-[11px] text-slate-400 font-medium italic mt-1">"{req.reason}"</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-6 md:mt-0">
                                        {req.status === 'Pending' ? (
                                            <>
                                                <button
                                                    disabled={actionLoading === req.id}
                                                    onClick={() => handleRequestAction(req, 'Approved')}
                                                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all font-display"
                                                >
                                                    {actionLoading === req.id ? 'Updating...' : 'Approve'}
                                                </button>
                                                <button
                                                    disabled={actionLoading === req.id}
                                                    onClick={() => handleRequestAction(req, 'Rejected')}
                                                    className="px-6 py-3 bg-white text-rose-600 border border-rose-100 rounded-xl font-bold text-sm hover:bg-rose-50 transition-all font-display"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                {req.status}
                                            </span>
                                        )}
                                        {req.medical_url && (
                                            <div className="relative group/med">
                                                <a href={req.medical_url} target="_blank" className="block w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:scale-110 transition-all">
                                                    {req.medical_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                        <img src={req.medical_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                                        </div>
                                                    )}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MEDICAL ARCHIVE SECTION */}
                {activeSection === 'medicals' && (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <header>
                            <h2 className="text-3xl font-black text-slate-900 font-display">Medical Archive</h2>
                            <p className="text-slate-500 font-medium">Global repository of all submitted health documents.</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {medicals.map(doc => (
                                <div key={doc.id} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all duration-700">
                                    <div className="w-full h-40 bg-slate-200 rounded-[2rem] mb-6 overflow-hidden relative">
                                        {doc.document_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <img
                                                src={doc.document_url}
                                                alt="Medical Preview"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <svg className="w-12 h-12 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={doc.document_url} target="_blank" className="px-6 py-2 bg-white rounded-xl font-bold text-xs uppercase tracking-widest">View Full Size</a>
                                        </div>
                                    </div>
                                    <h4 className="font-black text-slate-900 text-lg mb-1">{doc.document_name || 'Medical Certificate'}</h4>
                                    <p className="text-xs font-bold text-primary-600 mb-4 uppercase tracking-tighter">Submitter: {doc.Profiles?.full_name || 'Staff Member'}</p>
                                    <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold">
                                        <span>UPLOADED</span>
                                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* USER DIRECTORY SECTION */}
                {activeSection === 'users' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <h2 className="text-3xl font-black text-slate-900 font-display">Staff Directory</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 font-bold text-slate-400 text-xs uppercase tracking-widest">
                                        <th className="pb-6 px-4">Full Name</th>
                                        <th className="pb-6 px-4">Current Role</th>
                                        <th className="pb-6 px-4">Balance</th>
                                        <th className="pb-6 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-slate-700 font-medium font-body">
                                    {users.map(u => (
                                        <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-6 px-4 font-bold text-slate-900">{u.full_name}</td>
                                            <td className="py-6 px-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tighter ${u.Roles?.name === 'Admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {u.Roles?.name || 'User'}
                                                </span>
                                            </td>
                                            <td className="py-6 px-4">{u.leave_balance} Days</td>
                                            <td className="py-6 px-4 text-right">
                                                <button className="text-primary-600 hover:text-primary-800 font-bold text-sm">Edit Role</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* LEAVE POLICIES SECTION */}
                {activeSection === 'leaves' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-black text-slate-900 font-display">Leave Policies</h2>
                            <button
                                onClick={handleAddType}
                                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all text-sm font-display"
                            >
                                + Add New Type
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {leaveTypes.map(t => (
                                <div key={t.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm font-black border border-slate-100">{t.name[0]}</div>
                                        <button
                                            onClick={() => handleDeletePolicy(t.id)}
                                            className="text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 mb-1 font-display">{t.name}</h4>
                                    <p className="text-slate-500 text-sm font-bold mb-4">Allowance: {t.max_days} Days / Year</p>
                                    <button
                                        onClick={() => handleUpdatePolicy(t.id, t.max_days)}
                                        disabled={actionLoading === t.id}
                                        className="w-full py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest font-display"
                                    >
                                        {actionLoading === t.id ? 'Updating...' : 'Update Policy'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
