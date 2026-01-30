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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
        setView('home')
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
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
      const res = await fetch('https://localhost:7066/api/Profile/roles')
      if (res.ok) setRoles(await res.json())
    } catch (err) { console.error('Roles fetch failed', err) }
  }

  const fetchProfile = async (userId) => {
    try {
      const res = await fetch(`https://localhost:7066/api/Profile/${userId}`)
      if (res.ok) setProfile(await res.json())
    } catch (err) { console.error('Profile fetch failed', err) }
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
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm shadow-slate-200 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Balance</h3>
                    <p className="text-3xl font-extrabold text-slate-900">{profile?.leaveBalance || 20} <span className="text-base text-slate-300">Days</span></p>
                  </div>
                  <div className="bg-primary-600 p-8 rounded-[2rem] shadow-xl shadow-primary-500/20 text-white">
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Role</h3>
                    <p className="text-2xl font-extrabold">{userRole}</p>
                  </div>
                  <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] text-white overflow-hidden relative group">
                    <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2 relative z-10">System Status</h3>
                    <p className="text-xl font-medium relative z-10">Connected to Supabase Real-time</p>
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
