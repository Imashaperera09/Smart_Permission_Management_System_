import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import LeaveRequestForm from './components/LeaveRequestForm'
import LeaveRequestList from './components/LeaveRequestList'
import ManagerApprovalList from './components/ManagerApprovalList'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [roles, setRoles] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [refreshList, setRefreshList] = useState(0)
  const [activeTab, setActiveTab] = useState('my-requests')
  const [view, setView] = useState('home') // 'home', 'login'
  const [stats, setStats] = useState({ approved: 0, pending: 0 })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
        fetchStats(session.user.id)
        setView('home')
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
        fetchStats(session.user.id)
        setView('home')
      } else {
        setProfile(null)
      }
    })

    fetchRoles()
    return () => subscription.unsubscribe()
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await fetch('http://localhost:5192/api/Profile/roles')
      if (res.ok) setRoles(await res.json())
    } catch (err) { console.error('Roles fetch failed', err) }
  }

  const fetchProfile = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5192/api/Profile/${userId}`)
      if (res.ok) setProfile(await res.json())
    } catch (err) { console.error('Profile fetch failed', err) }
  }

  const fetchStats = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('LeaveRequests')
        .select('status')
        .eq('user_id', userId)

      if (data) {
        const approved = data.filter(r => r.status === 'Approved').length
        const pending = data.filter(r => r.status === 'Pending').length
        setStats({ approved, pending })
      }
    } catch (err) { console.error('Stats fetch failed', err) }
  }

  if (view === 'login') {
    return (
      <div className="relative">
        <button
          onClick={() => setView('home')}
          className="absolute top-8 left-8 z-50 text-white bg-black/20 hover:bg-black/40 px-4 py-2 rounded-xl font-bold backdrop-blur-md transition-all"
        >
          ← Back to Home
        </button>
        <Login />
      </div>
    )
  }

  const userRole = roles.find(r => r.id === profile?.roleId)?.name || 'Guest'
  const isManager = userRole === 'Manager' || userRole === 'Admin'

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Premium Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20 transform -rotate-3">S</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-900 bg-clip-text text-transparent font-display">Smart Leave</h1>
          </div>
          <div className="flex items-center gap-6">
            {!session ? (
              <button
                onClick={() => setView('login')}
                className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-500/40 transition-all active:scale-95"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end border-r pr-6">
                  <span className="text-sm font-bold text-slate-900">{profile?.fullName || session.user.email}</span>
                  <span className="text-xs font-medium text-slate-400">{userRole}</span>
                </div>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-4 py-2 text-slate-500 hover:text-red-500 font-semibold transition-colors text-sm"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow">
        {!session ? (
          /* Public Landing View */
          <div className="flex flex-col items-center text-center py-20 px-4">
            <div className="w-24 h-24 bg-primary-100 rounded-[2.5rem] flex items-center justify-center text-primary-600 mb-10 animate-float shadow-inner">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight font-display">
              Simplify Your <br /> <span className="text-primary-600">Leave Management</span>
            </h1>
            <p className="text-slate-500 text-xl max-w-2xl mb-12 leading-relaxed">
              The modern way to track, request, and approve leaves. Real-time balance updates, seamless communication, and smart conflict detection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setView('login')}
                className="px-10 py-5 bg-primary-600 text-white rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-primary-500/30 hover:bg-primary-700 hover:-translate-y-1 transition-all"
              >
                Get Started Now
              </button>
              <div className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-[1.5rem] font-bold text-lg shadow-sm">
                Learn More
              </div>
            </div>

            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              {[
                { title: 'Smart Validation', desc: 'No more overlaps or balance errors.', icon: '⚡' },
                { title: 'Role Based', desc: 'Different workflows for Staff and Managers.', icon: '🛡️' },
                { title: 'Real-time', desc: 'Instant notifications and status updates.', icon: '⏰' }
              ].map((f, i) => (
                <div key={i} className="bg-white/50 p-8 rounded-[2rem] border border-slate-100 text-left">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
              <div>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-2">My Workspace</h1>
                <p className="text-slate-500 text-lg">Hello {profile?.fullName || 'there'}, ready to manage your time?</p>
              </div>
              <div className="flex items-center gap-3">
                {isManager && (
                  <div className="flex bg-slate-200/50 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setActiveTab('my-requests')}
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'my-requests' ? 'bg-white shadow-md text-primary-600' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      My Portal
                    </button>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'approvals' ? 'bg-white shadow-md text-primary-600' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Approvals
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowForm(!showForm)}
                  className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-xl cursor-pointer ${showForm
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-primary-500/30'
                    }`}
                >
                  {showForm ? 'Close Editor' : '+ Create Request'}
                </button>
              </div>
            </div>

            {showForm && (
              <div className="mb-12 animate-in fade-in slide-in-from-top-6 duration-500">
                <div className="max-w-3xl mx-auto">
                  <LeaveRequestForm onComplete={() => {
                    setShowForm(false)
                    setRefreshList(prev => prev + 1)
                  }} />
                </div>
              </div>
            )}

            {activeTab === 'my-requests' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                  {/* Balance Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:rotate-12 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 font-display">Leave Balance</h3>
                      <p className="text-4xl font-black text-slate-900 leading-none">
                        {profile?.leaveBalance || 20} <span className="text-base font-bold text-slate-300">Days</span>
                      </p>
                    </div>
                  </div>

                  {/* Approved Stats Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:rotate-12 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 font-display">Approved</h3>
                      <p className="text-4xl font-black text-slate-900 leading-none">
                        {stats.approved} <span className="text-base font-bold text-slate-300">Requests</span>
                      </p>
                    </div>
                  </div>

                  {/* Pending Stats Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:rotate-12 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 font-display">Pending</h3>
                      <p className="text-4xl font-black text-slate-900 leading-none">
                        {stats.pending} <span className="text-base font-bold text-slate-300">Awaiting</span>
                      </p>
                    </div>
                  </div>

                  {/* Profile/Role Status Card - Compact */}
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative group border border-slate-800">
                    <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all duration-1000"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 font-display">Current Access</h3>
                        <p className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{userRole} Portal</p>
                      </div>
                      <div className="mt-6 flex items-center gap-3 py-2 px-3 bg-white/5 rounded-xl border border-white/10 w-fit backdrop-blur-sm">
                        <div className="w-6 h-6 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"></path></svg>
                        </div>
                        <span className="text-xs font-semibold text-slate-300">Account Verified</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <LeaveRequestList key={refreshList} />
                </div>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <ManagerApprovalList />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="py-20 bg-slate-100/50 mt-auto border-t">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-2xl font-bold text-slate-400 mb-4 font-display">Smart Leave</div>
          <p className="text-slate-400 text-sm italic mb-8">Efficient. Beautiful. Smart.</p>
          <div className="text-slate-300 text-xs">
            &copy; 2026 Smart Leave & Permission Management System
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
