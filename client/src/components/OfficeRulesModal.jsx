import React from 'react';

const OfficeRulesModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const rules = [
        {
            title: 'Annual Leave Policy',
            content: 'Employees are entitled to 20 days of paid annual leave per calendar year. Leave requests should be submitted at least 2 weeks in advance.',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        },
        {
            title: 'Sick Leave',
            content: 'Medical certificates are required for sick leave exceeding 2 consecutive days. Please notify your manager as early as possible.',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        },
        {
            title: 'Approval Workflow',
            content: 'All leave requests must be approved by your immediate manager. You will receive an instant notification once a decision is made.',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        },
        {
            title: 'Working Hours',
            content: 'Standard working hours are from 9:00 AM to 5:30 PM, Monday to Friday. Half-day leaves can be requested for morning or afternoon sessions.',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-primary-50/30">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 font-display">Office Rules</h2>
                        <p className="text-slate-600 text-sm font-medium mt-1">Key policies and leave management guidelines</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl shadow-sm border border-slate-100 transition-all hover:scale-110 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-6">
                        {rules.map((rule, idx) => (
                            <div key={idx} className="flex gap-6 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-500">
                                <div className="w-14 h-14 shrink-0 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {rule.icon}
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">{rule.title}</h3>
                                    <p className="text-slate-600 leading-relaxed text-sm font-medium">{rule.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-primary-600 rounded-[2rem] text-white overflow-hidden relative group">
                        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative z-10">
                            <h4 className="font-bold text-lg mb-1">Need help?</h4>
                            <p className="text-white/80 text-sm font-medium">Contact the HR department if you have any further questions regarding the policy.</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all hover:-translate-y-1"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfficeRulesModal;
