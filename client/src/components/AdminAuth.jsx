import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminAuth({ onBack }) {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [fullName, setFullName] = useState('')

    const handleAdminAuth = async (e) => {
        e.preventDefault()
        setLoading(true)

        if (isSignUp) {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'Admin' // This triggers the trigger to set role_id to Admin
                    }
                }
            })
            if (error) alert(error.message)
            else alert('Admin request sent! Check your email for confirmation.')
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) alert(error.message)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
            {/* Dark abstract backgrounds */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-900/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-1/2 h-full bg-blue-900/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-lg bg-slate-900/50 backdrop-blur-2xl border border-slate-800 p-12 rounded-[3rem] shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <button
                    onClick={onBack}
                    className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors font-bold text-sm"
                >
                    ← Back to Portal
                </button>

                <div className="text-center mb-12 mt-4">
                    <div className="w-20 h-20 bg-gradient-to-tr from-primary-600 to-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-primary-500/20 mx-auto mb-6 transform -rotate-6">A</div>
                    <h1 className="text-4xl font-black text-white mb-3 tracking-tight font-display">Admin Workspace</h1>
                    <p className="text-slate-400 font-medium">System configuration and management console.</p>
                </div>

                <form onSubmit={handleAdminAuth} className="space-y-6">
                    {isSignUp && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Full Name</label>
                            <input
                                type="text"
                                required
                                placeholder="Admin Name"
                                className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Admin Email</label>
                        <input
                            type="email"
                            required
                            placeholder="admin@smartleave.com"
                            className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Secure Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black text-lg hover:bg-primary-500 hover:text-white transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-xl shadow-white/5"
                    >
                        {loading ? 'Securing Access...' : isSignUp ? 'Initialize Administrator' : 'Enter Workspace'}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-slate-500 font-bold hover:text-white transition-colors text-sm"
                    >
                        {isSignUp ? 'Existing Administrator? Sign In' : "New Administrator? Register Workspace"}
                    </button>
                </div>
            </div>

            <div className="absolute bottom-8 text-slate-600 text-xs font-bold tracking-[0.2em] uppercase">
                Secure Environment • Smart Leave System v2.0
            </div>
        </div>
    )
}
