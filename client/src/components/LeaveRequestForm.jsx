import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function LeaveRequestForm({ onComplete }) {
    const [loading, setLoading] = useState(false)
    const [leaveTypes, setLeaveTypes] = useState([])
    const [file, setFile] = useState(null)
    const [formData, setFormData] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
        medical_url: ''
    })

    useEffect(() => {
        fetchLeaveTypes()
    }, [])

    const fetchLeaveTypes = async () => {
        const { data, error } = await supabase.from('LeaveTypes').select('*')
        if (!error) setLeaveTypes(data)
    }

    const handleFileUpload = async () => {
        if (!file) return null

        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('medicals')
            .upload(filePath, file)

        if (uploadError) {
            throw new Error('Error uploading medical document: ' + uploadError.message)
        }

        const { data: { publicUrl } } = supabase.storage
            .from('medicals')
            .getPublicUrl(filePath)

        return publicUrl
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            let medicalUrl = formData.medical_url
            if (file) {
                medicalUrl = await handleFileUpload()
            }

            const response = await fetch('http://localhost:5192/api/LeaveRequest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    UserId: user.id,
                    LeaveTypeId: formData.leave_type_id,
                    StartDate: formData.start_date,
                    EndDate: formData.end_date,
                    Reason: formData.reason,
                    MedicalUrl: medicalUrl,
                    Status: 'Pending',
                    CreatedAt: new Date().toISOString()
                })
            })

            if (response.ok) {
                onComplete()
            } else {
                const error = await response.text()
                alert('Failed to submit: ' + error)
            }
        } catch (err) {
            alert('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const selectedType = leaveTypes.find(t => t.id === formData.leave_type_id)
    const isMedical = selectedType?.name.toLowerCase().includes('medical') || selectedType?.name.toLowerCase().includes('sick')

    return (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-8 font-display">New Request</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Leave Category</label>
                    <div className="relative group">
                        <select
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all appearance-none cursor-pointer pr-12 text-slate-900 font-medium"
                            value={formData.leave_type_id}
                            onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                        >
                            <option value="">Select category...</option>
                            {leaveTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.name} (Max {t.max_days} days)</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Start Date</label>
                        <input
                            type="date"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-slate-900 font-medium"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">End Date</label>
                        <input
                            type="date"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-slate-900 font-medium"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Reason for Leave</label>
                    <textarea
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none text-slate-900 font-medium"
                        rows="3"
                        placeholder="Briefly explain the reason..."
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    ></textarea>
                </div>

                {isMedical && (
                    <div className="space-y-4 p-6 rounded-[2rem] bg-rose-50/50 border border-rose-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                            </div>
                            <label className="text-sm font-bold text-rose-900">Medical Document Attachment</label>
                        </div>
                        <input
                            type="file"
                            accept=".pdf,image/*"
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white file:text-rose-600 hover:file:bg-rose-50 file:transition-all cursor-pointer"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        <p className="text-[10px] text-rose-400 font-medium px-1">Upload a scanned copy or photo of your medical certificate (Max 5MB)</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Submitting Request...
                        </span>
                    ) : 'Confirm Request'}
                </button>
            </form>
        </div>
    )
}
