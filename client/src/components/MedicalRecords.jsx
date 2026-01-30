import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function MedicalRecords() {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState(null)
    const [previewDoc, setPreviewDoc] = useState(null)
    const [processingId, setProcessingId] = useState(null) // State for individual record actions

    useEffect(() => {
        fetchMedicalRecords()
    }, [])

    const fetchMedicalRecords = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        // 1. Fetch leave requests that have medical URLs
        const { data: leaveData, error: leaveError } = await supabase
            .from('LeaveRequests')
            .select('*, LeaveTypes(name)')
            .eq('user_id', user.id)
            .not('medical_url', 'is', null)

        // 2. Fetch standalone medical documents
        const { data: docData, error: docError } = await supabase
            .from('MedicalDocuments')
            .select('*')
            .eq('user_id', user.id)

        if (leaveError || docError) {
            console.error('Error fetching medical records:', leaveError || docError)
        } else {
            // Merge and sort by created_at desc
            const merged = [
                ...leaveData.map(r => ({ ...r, isStandalone: false })),
                ...docData.map(d => ({ ...d, isStandalone: true }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

            setRecords(merged)
        }
        setLoading(false)
    }

    const handleQuickUpload = async (e) => {
        e.preventDefault()
        if (!file) return

        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Upload file to Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('medicals')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('medicals')
                .getPublicUrl(filePath)

            // 2. Insert record into MedicalDocuments table
            const { error: dbError } = await supabase
                .from('MedicalDocuments')
                .insert([
                    {
                        user_id: user.id,
                        document_url: publicUrl,
                        document_name: file.name
                    }
                ])

            if (dbError) throw dbError

            alert('Document uploaded and saved successfully! ✅')
            setFile(null)
            fetchMedicalRecords()
        } catch (err) {
            alert('Upload failed: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (rec) => {
        if (!rec.isStandalone) return
        if (!confirm('Are you sure you want to permanently delete this medical document?')) return

        setProcessingId(rec.id)
        try {
            // 1. Delete from Storage
            const fileName = rec.document_url.split('/').pop()
            await supabase.storage.from('medicals').remove([fileName])

            // 2. Delete from DB
            const { error: dbError } = await supabase
                .from('MedicalDocuments')
                .delete()
                .eq('id', rec.id)

            if (dbError) throw dbError
            fetchMedicalRecords()
        } catch (err) {
            alert('Delete failed: ' + err.message)
        } finally {
            setProcessingId(null)
        }
    }

    const handleReplace = async (rec, newFile) => {
        if (!newFile) return

        setProcessingId(rec.id)
        try {
            // 1. Delete old file from Storage
            const oldFileName = rec.document_url.split('/').pop()
            await supabase.storage.from('medicals').remove([oldFileName])

            // 2. Upload new file
            const fileExt = newFile.name.split('.').pop()
            const newFileName = `${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('medicals')
                .upload(newFileName, newFile)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('medicals')
                .getPublicUrl(newFileName)

            // 3. Update DB record
            const { error: dbError } = await supabase
                .from('MedicalDocuments')
                .update({
                    document_url: publicUrl,
                    document_name: newFile.name
                })
                .eq('id', rec.id)

            if (dbError) throw dbError
            fetchMedicalRecords()
        } catch (err) {
            alert('Update failed: ' + err.message)
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <span className="text-slate-500 font-medium">Loading records...</span>
            </div>
        </div>
    )

    return (
        <div className="space-y-8">
            {/* Document Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
                        onClick={() => setPreviewDoc(null)}
                    ></div>
                    <div className="relative bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                            <div>
                                <h3 className="font-black text-slate-900 font-display text-xl tracking-tight">Document Preview</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{previewDoc.name || 'Medical Certificate'}</p>
                            </div>
                            <button
                                onClick={() => setPreviewDoc(null)}
                                className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm border border-slate-100"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-50 p-4 overflow-auto flex items-center justify-center">
                            {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={previewDoc.url}
                                    className="w-full h-full rounded-2xl border-0 shadow-lg"
                                    title="PDF Preview"
                                />
                            ) : (
                                <img
                                    src={previewDoc.url}
                                    alt="Medical Document"
                                    className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain border-4 border-white"
                                />
                            )}
                        </div>
                        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setPreviewDoc(null)}
                                className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                            >
                                Close
                            </button>
                            <a
                                href={previewDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-primary-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                Open in New Tab
                            </a>
                        </div>
                    </div>
                </div>
            )}
            {/* Quick Upload Section */}
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="max-w-md">
                            <h3 className="text-2xl font-black text-slate-900 font-display mb-2 tracking-tight">Quick Document Upload</h3>
                            <p className="text-slate-500 text-sm font-medium">Need to submit a medical paper quickly? Upload it here and it will be stored in your digital records.</p>
                        </div>
                        <form onSubmit={handleQuickUpload} className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-3 rounded-[2rem] border border-slate-100 w-full md:w-auto">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-primary-600 hover:file:bg-primary-50 file:transition-all cursor-pointer"
                            />
                            <button
                                type="submit"
                                disabled={!file || uploading}
                                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                        Submit Document
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 font-display tracking-tight">Records Library</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Access and manage your submitted medical certificates</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl">
                        <span className="text-sm font-bold text-slate-600 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">{records.length} Documents</span>
                    </div>
                </div>

                <div className="p-8">
                    {records.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-200">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a11 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-900 font-bold text-xl">No medical documents yet</p>
                                    <p className="text-slate-500 max-w-xs mx-auto">When you upload a medical certificate during leave application, it will appear here for easy access.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {records.map((rec) => (
                                <div key={rec.id} className="group relative bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 hover:bg-white hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 hover:-translate-y-1">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-4 py-1.5 bg-white rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-50 ${rec.isStandalone ? 'text-blue-500' : 'text-slate-400'}`}>
                                                {rec.isStandalone ? 'Standalone' : 'Verified'}
                                            </span>
                                            {rec.isStandalone && (
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <label className="w-8 h-8 bg-white text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-sm border border-slate-100" title="Replace Document">
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*,.pdf"
                                                            onChange={(e) => handleReplace(rec, e.target.files[0])}
                                                            disabled={processingId === rec.id}
                                                        />
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                                    </label>
                                                    <button
                                                        onClick={() => handleDelete(rec)}
                                                        disabled={processingId === rec.id}
                                                        className="w-8 h-8 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-100"
                                                        title="Delete Document"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Medical Certificate</h3>
                                    <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-2">
                                        {rec.isStandalone
                                            ? `Quick upload: ${rec.document_name || 'Medical Document'}`
                                            : `Attached to your ${rec.LeaveTypes?.name} from ${new Date(rec.start_date).toLocaleDateString()}`
                                        }
                                    </p>

                                    <div className="space-y-3 pt-6 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-400 uppercase tracking-tighter">Submitted</span>
                                            <span className="font-bold text-slate-700">{new Date(rec.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <button
                                            onClick={() => setPreviewDoc({
                                                url: rec.isStandalone ? rec.document_url : rec.medical_url,
                                                name: rec.isStandalone ? rec.document_name : `Certificate - ${new Date(rec.created_at).toLocaleDateString()}`
                                            })}
                                            disabled={processingId === rec.id}
                                            className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-primary-600 transition-colors shadow-lg shadow-slate-900/10 disabled:opacity-50"
                                        >
                                            {processingId === rec.id ? (
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                            )}
                                            View Document
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
