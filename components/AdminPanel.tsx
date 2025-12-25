
import React, { useState, useEffect, useMemo } from 'react';
import { getTickets, saveAnnouncement, updateTicketStatus, getConfig, saveConfig, declareWinner, getWinners } from '../services/mockStore';
import { Ticket, AppConfig, PrizeType, Winner } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
  onAnnounce: (msg: string) => void;
  adminEmail: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, onAnnounce, adminEmail }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'config'>('pending');
  const [config, setConfig] = useState<AppConfig>(getConfig());
  
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [adminFilter, setAdminFilter] = useState('all');

  useEffect(() => {
    const fetchData = () => {
      setTickets(getTickets());
      setWinners(getWinners());
      const currentConfig = getConfig();
      setConfig(currentConfig);
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleStatus = (id: string, status: 'approved' | 'rejected') => {
    const adminIdentifier = config.adminName || adminEmail;
    updateTicketStatus(id, status, adminIdentifier);
    setTickets(getTickets());
  };

  const handleDeclareWinner = (ticket: Ticket) => {
    if (!window.confirm(`DECLARE ${ticket.name} AS WINNER? / کیا آپ انہیں فاتح قرار دینا چاہتے ہیں؟`)) return;
    declareWinner(ticket);
    setWinners(getWinners());
    setTickets(getTickets());
    alert("WINNER DECLARED! HALL OF FAME UPDATED.");
  };

  const handleBroadcast = () => {
    if (!newMsg) return;
    saveAnnouncement(newMsg);
    onAnnounce(newMsg);
    setNewMsg('');
    alert('TRANSMISSION SUCCESSFUL / براڈکاسٹ کامیاب');
  };

  const handleConfigSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(config);
    alert('SYSTEM PARAMETERS SYNCHRONIZED / سیٹنگز محفوظ ہوگئیں');
  };

  const pendingTickets = tickets.filter(t => t.status === 'pending');
  
  const uniqueAdmins = useMemo(() => {
    const admins = new Set<string>();
    tickets.forEach(t => {
      if (t.processedBy) admins.add(t.processedBy);
    });
    return Array.from(admins);
  }, [tickets]);

  const historyTickets = useMemo(() => {
    let filtered = tickets
      .filter(t => t.status !== 'pending')
      .sort((a, b) => (b.processedAt || 0) - (a.processedAt || 0));
    
    if (historySearch) {
      const search = historySearch.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) || 
        t.ticketNumber.toLowerCase().includes(search) ||
        (t.processedBy || '').toLowerCase().includes(search) ||
        t.mobile.includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (adminFilter !== 'all') {
      filtered = filtered.filter(t => t.processedBy === adminFilter);
    }

    return filtered;
  }, [tickets, historySearch, statusFilter, adminFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
        <div>
          <h2 className="text-3xl font-black italic font-luxury gold-gradient">Administrative Node</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">
            Status: <span className="text-zinc-200">Active Node / فعال</span> • 
            Validator: <span className="text-yellow-500">{config.adminName || adminEmail}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <a href={config.managementLink} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 rounded-xl bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-yellow-500/20 flex items-center gap-2">
            <span>OFFICIAL KR LINK</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
          <button onClick={onLogout} className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">Logout</button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-white/5 overflow-x-auto no-scrollbar">
        {[
          { id: 'pending', label: `QUEUE (${pendingTickets.length})` },
          { id: 'history', label: `HISTORY (${historyTickets.length})` },
          { id: 'config', label: 'SYSTEM SETTINGS' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-yellow-500' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500 shadow-[0_0_8px_#ca8a04]"></div>}
          </button>
        ))}
      </div>

      {activeTab === 'pending' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingTickets.length === 0 ? (
            <div className="col-span-full py-24 text-center glass rounded-[2.5rem] border-2 border-dashed border-white/5">
              <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No entries in queue.</p>
            </div>
          ) : (
            pendingTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} onStatus={handleStatus} />
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <div className="md:col-span-6 relative">
              <input type="text" placeholder="Search records..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-10 py-3 text-xs text-zinc-200 outline-none focus:border-yellow-500/30 transition-all" />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="md:col-span-3">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-300 outline-none cursor-pointer">
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <select value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-300 outline-none cursor-pointer">
                <option value="all">All Admins</option>
                {uniqueAdmins.map(admin => <option key={admin} value={admin}>{admin}</option>)}
              </select>
            </div>
          </div>

          <div className="glass rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Action</th>
                    <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Time</th>
                    <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Ticket ID</th>
                    <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Participant</th>
                    <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Prize</th>
                    <th className="px-6 py-5 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historyTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        {ticket.status === 'approved' && !ticket.isWinner && (
                          <button 
                            onClick={() => handleDeclareWinner(ticket)}
                            className="px-3 py-1.5 rounded-lg bg-yellow-500 text-black text-[8px] font-black uppercase tracking-tighter hover:scale-105 transition-all"
                          >
                            Declare Winner
                          </button>
                        )}
                        {ticket.isWinner && (
                          <span className="text-yellow-500 text-[8px] font-black uppercase flex items-center gap-1">
                            <span className="animate-bounce">🏆</span> WINNER
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-mono text-zinc-400">{new Date(ticket.processedAt || 0).toLocaleTimeString()}</td>
                      <td className="px-6 py-4 text-[10px] font-black text-zinc-300 tracking-wider">{ticket.ticketNumber}</td>
                      <td className="px-6 py-4 text-[11px] font-black text-white">{ticket.name}</td>
                      <td className="px-6 py-4"><span className="text-[8px] text-yellow-500/80 uppercase font-black tracking-widest border border-yellow-500/20 px-2.5 py-1 rounded bg-yellow-500/[0.03]">{ticket.prize === PrizeType.MOBILE ? 'Fun Mobile' : ticket.prize}</span></td>
                      <td className="px-6 py-4 text-right"><span className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${ticket.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{ticket.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Announcement</h3>
              <textarea value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Send a global message to all users..." className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-zinc-100 outline-none h-32 text-sm focus:border-yellow-500/50 transition-all" />
              <button onClick={handleBroadcast} className="btn-gold w-full py-4 rounded-xl text-[10px] uppercase tracking-widest font-black shadow-lg">Broadcast Notification</button>
            </div>

            <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Showcase Photo Management</h3>
              <p className="text-[9px] text-zinc-600 font-bold uppercase mb-4">Provide high-quality URLs for prizes like 'Fun Mobile' to attract more users.</p>
              <div className="space-y-4">
                {Object.values(PrizeType).map(type => (
                  <div key={type} className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest ml-1">{type === PrizeType.MOBILE ? 'Fun Mobile' : type} Photo Link</label>
                    <input type="url" value={config.prizeImages[type]} onChange={e => setConfig({...config, prizeImages: {...config.prizeImages, [type]: e.target.value}})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-yellow-500/40" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleConfigSave} className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-8">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b border-white/5 pb-2">Financial Gateways</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest ml-1">JazzCash Name</label><input value={config.jazzCashName} onChange={e => setConfig({...config, jazzCashName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 outline-none" /></div>
                  <div className="space-y-1"><label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest ml-1">JazzCash #</label><input value={config.jazzCash} onChange={e => setConfig({...config, jazzCash: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest ml-1">EasyPaisa Name</label><input value={config.easyPaisaName} onChange={e => setConfig({...config, easyPaisaName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 outline-none" /></div>
                  <div className="space-y-1"><label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest ml-1">EasyPaisa #</label><input value={config.easyPaisa} onChange={e => setConfig({...config, easyPaisa: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Bank Title</label><input value={config.bankAccountName} onChange={e => setConfig({...config, bankAccountName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 outline-none" /></div>
                  <div className="space-y-1"><label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest ml-1">IBAN / Acc #</label><input value={config.bankAccount} onChange={e => setConfig({...config, bankAccount: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 outline-none" /></div>
                </div>
              </div>
            </div>
            <button type="submit" className="w-full py-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-yellow-500/20 transition-all">Update System Parameters</button>
          </form>
        </div>
      )}
    </div>
  );
};

const TicketCard: React.FC<{ ticket: Ticket, onStatus: (id: string, s: 'approved' | 'rejected') => void }> = ({ ticket, onStatus }) => (
  <div className={`glass p-6 rounded-[2.5rem] border space-y-6 relative overflow-hidden transition-all duration-300 ${
    ticket.isReferralFree 
      ? 'bg-yellow-500/[0.04] border-yellow-500/40 shadow-[0_0_20px_rgba(202,138,4,0.05)]' 
      : ticket.referredBy 
        ? 'bg-indigo-500/[0.03] border-indigo-500/20' 
        : 'border-white/10'
  }`}>
    <div className="absolute top-0 right-0 flex">
      <div className={`px-4 py-2 text-black text-[8px] font-black uppercase tracking-widest rounded-bl-2xl ${ticket.deviceType === 'mobile' ? 'bg-blue-500' : 'bg-zinc-500'}`}>
        {ticket.deviceType} ENTRY
      </div>
      {ticket.referredBy && (
        <div className="px-4 py-2 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg flex items-center gap-1.5">
          <span className="animate-pulse">★</span> REFERRAL
        </div>
      )}
      {ticket.isReferralFree && (
        <div className="px-4 py-2 bg-yellow-500 text-black text-[8px] font-black uppercase tracking-widest rounded-bl-2xl">
          FREE REWARD
        </div>
      )}
    </div>

    <div className="flex justify-between items-start">
      <div className="flex-1">
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{ticket.ticketNumber}</span>
        <h4 className="text-xl font-black font-luxury text-white leading-tight">{ticket.name}</h4>
      </div>
      <div className="text-right">
        <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full border border-zinc-500/20 bg-zinc-500/10 text-zinc-500`}>PENDING KR</span>
      </div>
    </div>

    <div className="flex gap-5 items-center bg-black/40 p-5 rounded-[2rem] border border-white/5">
      <div className="w-24 h-24 rounded-2xl bg-zinc-900 overflow-hidden border border-white/10 flex-shrink-0 cursor-zoom-in group" onClick={() => window.open(ticket.proofUrl)}>
        <img src={ticket.proofUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Receipt" />
      </div>
      <div className="text-[10px] space-y-3 flex-1">
        <div className="grid grid-cols-2 gap-4">
           <div>
              <p className="text-[8px] font-black text-zinc-600 uppercase mb-0.5">Target</p>
              <p className="font-black text-yellow-500 text-xs">{ticket.prize === PrizeType.MOBILE ? 'Fun Mobile' : ticket.prize}</p>
           </div>
           <div>
              <p className="text-[8px] font-black text-zinc-600 uppercase mb-0.5">Phone</p>
              <p className="font-bold text-zinc-300 text-xs">{ticket.mobile}</p>
           </div>
        </div>
        
        {ticket.referredBy && (
          <div className="pt-2 border-t border-white/5 mt-1">
            <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Referred By / ریفرر کوڈ</p>
            <div className="inline-block px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
               <span className="text-indigo-400 font-black tracking-widest text-[10px]">{ticket.referredBy}</span>
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="flex gap-4 pt-2">
      <button onClick={() => onStatus(ticket.id, 'approved')} className="flex-[2] py-4 bg-green-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 active:scale-95 transition-all">Approve Entry</button>
      <button onClick={() => onStatus(ticket.id, 'rejected')} className="flex-1 py-4 bg-zinc-900 text-red-500 border border-red-500/10 rounded-2xl text-[10px] font-black uppercase active:scale-95 transition-all">Reject</button>
    </div>
  </div>
);
