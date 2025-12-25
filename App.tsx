
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PrizeType, Ticket, PrizeStats, Announcement, AppConfig, Winner } from './types';
import { getTickets, saveTicket, getAnnouncement, getConfig, getWinners, getNewsArchive } from './services/mockStore';
import { getLuckyMantra, verifyPaymentScreenshot } from './services/geminiService';
import { StatsBoard } from './components/StatsBoard';
import { AdminPanel } from './components/AdminPanel';
import { WinnerWall } from './components/WinnerWall';
import { Toaster, Toast } from './components/Toaster';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement>({ text: 'Syncing...', timestamp: Date.now() });
  const [newsArchive, setNewsArchive] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<PrizeStats>({ 
    [PrizeType.MOBILE]: 0, [PrizeType.BIKE]: 0, [PrizeType.FAN]: 0,
    total: 0, mobileDeviceCount: 0, desktopDeviceCount: 0
  });
  const [config, setAppConfig] = useState<AppConfig>(getConfig());
  const [winners, setWinners] = useState<Winner[]>([]);
  const [luckyMantra, setLuckyMantra] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [newsTicker, setNewsTicker] = useState<string[]>([]);
  const [activeVisitors, setActiveVisitors] = useState(142);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isHealthy, setIsHealthy] = useState(true);

  const lastTicketCount = useRef(0);
  const lastWinnerCount = useRef(0);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [prize, setPrize] = useState<PrizeType>(PrizeType.MOBILE);
  const [file, setFile] = useState<File | null>(null);
  const [referredBy, setReferredBy] = useState('');
  const [isRefLocked, setIsRefLocked] = useState(false);

  const [userReferralCode, setUserReferralCode] = useState<string | null>(localStorage.getItem('my_referral_code'));
  const [verifiedReferralCount, setVerifiedReferralCount] = useState(0);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, timestamp: Date.now() }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = useCallback(() => {
    try {
      const tickets = getTickets();
      const currentWinners = getWinners();
      const currentConfig = getConfig();
      const currentAnnounce = getAnnouncement();
      const currentArchive = getNewsArchive();
      
      const newStats: PrizeStats = {
        [PrizeType.MOBILE]: 0, [PrizeType.BIKE]: 0, [PrizeType.FAN]: 0,
        total: tickets.length, mobileDeviceCount: 0, desktopDeviceCount: 0
      };

      tickets.forEach(t => {
        newStats[t.prize]++;
        if (t.deviceType === 'mobile') newStats.mobileDeviceCount++;
        else newStats.desktopDeviceCount++;
      });
      
      lastTicketCount.current = tickets.length;
      lastWinnerCount.current = currentWinners.length;

      setStats(newStats);
      setWinners(currentWinners);
      setAnnouncement(currentAnnounce);
      setNewsArchive(currentArchive);
      setAppConfig(currentConfig);

      if (userReferralCode) {
        const count = tickets.filter(t => t.referredBy === userReferralCode && t.status === 'approved').length;
        setVerifiedReferralCount(count);
      }

      const newsItems = [
        `[BREAKING] ${currentAnnounce.text}`,
        `TOTAL PARTICIPANTS: ${tickets.length.toLocaleString()}`,
        `WINNERS THIS SESSION: ${currentWinners.length}`,
        `MOST POPULAR: ${newStats[PrizeType.MOBILE] > newStats[PrizeType.BIKE] ? 'Fun Mobile' : 'Motorbike'}`
      ];
      tickets.slice(-5).forEach(t => newsItems.push(`RECENT: ${t.name.split(' ')[0]} joined via ${t.deviceType}`));
      setNewsTicker(newsItems);

      setActiveVisitors(v => v + (Math.random() > 0.5 ? 1 : -1));
      setIsHealthy(true);
    } catch (err) {
      setIsHealthy(false);
    }
  }, [userReferralCode, isAdmin]);

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 3000);
    return () => clearInterval(timer);
  }, [refreshData]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === config.adminEmail && adminPass === config.adminKey) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      addToast("Administrative Access Granted", 'success');
      setAdminPass('');
    } else {
      addToast("Invalid Terminal Credentials", 'warning');
    }
  };

  const validateForm = () => {
    const cleanName = name.trim();
    const cleanMobile = mobile.trim();

    if (!cleanName || cleanName.length < 3) {
      addToast("Invalid Name: Use at least 3 characters.", "warning");
      return false;
    }

    const mobileRegex = /^03[0-9]{9}$/;
    if (!mobileRegex.test(cleanMobile)) {
      addToast("Invalid Mobile: Use Pakistan format (03XXXXXXXXX).", "warning");
      return false;
    }

    if (!Object.values(PrizeType).includes(prize)) {
      addToast("Invalid Selection: Please choose a valid prize.", "warning");
      return false;
    }

    if (!file) {
      addToast("Receipt Required: Please upload payment proof.", "warning");
      return false;
    }

    return true;
  };

  const handleBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file!);
      const ticketId = `VIP-${Math.floor(10000 + Math.random() * 90000)}`;
      
      await verifyPaymentScreenshot(base64);
      
      const finalName = name.trim();
      const finalMobile = mobile.trim();

      const newTicket: Ticket = {
        id: Math.random().toString(36).substr(2, 9),
        ticketNumber: ticketId,
        name: finalName,
        mobile: finalMobile,
        prize,
        proofUrl: `data:${file!.type};base64,${base64}`,
        status: 'pending',
        timestamp: Date.now(),
        referralCode: userReferralCode || finalMobile.slice(-4),
        referredBy: referredBy.trim() || undefined,
        deviceType: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      };

      saveTicket(newTicket);
      const mantra = await getLuckyMantra(finalName, prize);
      setLuckyMantra(mantra);
      
      setName('');
      setMobile('');
      setFile(null);
      
      refreshData();
      addToast("Ticket Secured! Awaiting Verification.", 'success');
    } catch (err) {
      addToast("Transmission failed. Please check your connection.", "warning");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-yellow-500/30 font-sans antialiased">
      <Toaster toasts={toasts} onRemove={removeToast} />
      
      <header className="sticky top-0 z-[60] glass border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl btn-gold flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(202,138,4,0.4)]">A</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase gold-gradient">Aura Platinum</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-red-500 animate-pulse'}`}></span>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{isHealthy ? 'System Optimal' : 'Sync Warning'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] font-black text-yellow-500 uppercase">{activeVisitors} NODES ACTIVE</span>
              <span className="text-[8px] text-zinc-600 font-bold">LIVE WORLDWIDE SYNC</span>
            </div>
            {!isAdmin && (
               <button onClick={() => setShowAdminLogin(true)} className="px-5 py-2 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest hover:border-yellow-500/50 hover:text-yellow-500 transition-all">Node Login</button>
            )}
          </div>
        </div>
      </header>

      <div className="bg-zinc-950 border-b border-white/5 py-2.5 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center gap-16 whitespace-nowrap animate-marquee">
          {newsTicker.length > 0 ? newsTicker.concat(newsTicker).map((news, i) => (
            <span key={i} className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-4">
              <span className="text-yellow-600">◆</span>
              {news}
            </span>
          )) : (
            <span className="text-[10px] font-bold text-zinc-700">Connecting to Aura news network...</span>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {isAdmin ? (
          <AdminPanel 
            adminEmail={config.adminEmail}
            onLogout={() => setIsAdmin(false)} 
            onAnnounce={(msg) => setAnnouncement({ text: msg, timestamp: Date.now() })} 
          />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="glass p-6 rounded-3xl border border-white/5 group hover:border-yellow-500/20 transition-all">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Network Tickets</p>
                  <p className="text-3xl font-black text-white group-hover:scale-105 transition-transform">{stats.total}</p>
               </div>
               <div className="glass p-6 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Winners Today</p>
                  <p className="text-3xl font-black text-yellow-500">{winners.length}</p>
               </div>
               <div className="glass p-6 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Live Nodes</p>
                  <p className="text-3xl font-black text-white">{activeVisitors}</p>
               </div>
               <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-green-500/5 to-transparent">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Payout Rating</p>
                  <p className="text-3xl font-black text-green-500">AAA+</p>
               </div>
            </div>

            <StatsBoard stats={stats} />
            <WinnerWall winners={winners} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               <div className="lg:col-span-12 glass p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>
                  <div className="flex flex-col md:flex-row gap-10 items-center">
                    <div className="flex-1 space-y-4">
                      <h2 className="text-3xl font-black font-luxury gold-gradient italic">The Aura VIP Protocol</h2>
                      <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                        Enter the platinum draw in seconds. Simply pay the network fee of <b>Rs {config.ticketPrice}</b> to any node below, 
                        upload the proof, and the AI will register your ticket automatically. 
                        No complex forms, no delays—just pure fortune.
                      </p>
                    </div>
                    <div className="flex gap-4">
                       {[
                         { title: 'Step 1', desc: 'Secure Pay', icon: '💎' },
                         { title: 'Step 2', desc: 'Auto Upload', icon: '📸' },
                         { title: 'Step 3', desc: 'Win Mobile', icon: '🏆' }
                       ].map((step, i) => (
                         <div key={i} className="glass p-5 rounded-3xl border border-white/10 w-32 text-center hover:border-yellow-500/40 transition-all cursor-default">
                           <div className="text-2xl mb-2">{step.icon}</div>
                           <p className="text-[9px] font-black uppercase text-zinc-600 mb-1">{step.title}</p>
                           <p className="text-[10px] font-black text-zinc-200">{step.desc}</p>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>

              <div className="lg:col-span-7">
                <div className="glass p-10 md:p-14 rounded-[3.5rem] border border-white/5 relative overflow-hidden shadow-2xl">
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-4xl font-black mb-1 font-luxury italic text-white tracking-tight">VIP Entry</h2>
                        <p className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.5em]">Network Registration Node</p>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/20 px-5 py-3 rounded-2xl text-center">
                         <p className="text-[10px] font-black text-zinc-500 uppercase">Fixed Fee</p>
                         <p className="text-xl font-black text-yellow-500">Rs {config.ticketPrice}</p>
                      </div>
                    </div>

                    <form onSubmit={handleBuyTicket} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-1">Name / نام</label>
                          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name (Min 3 chars)" className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4.5 focus:ring-1 focus:ring-yellow-500 text-white outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-1">Mobile / فون</label>
                          <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="03XXXXXXXXX" className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4.5 focus:ring-1 focus:ring-yellow-500 text-white outline-none transition-all" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest block text-center">Target Platinum Prize</label>
                        <div className="grid grid-cols-3 gap-4">
                          {Object.values(PrizeType).map(p => (
                            <button key={p} type="button" onClick={() => setPrize(p)} className={`py-5 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all ${prize === p ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500 shadow-[0_0_20px_rgba(202,138,4,0.2)]' : 'border-white/5 bg-zinc-900/40 text-zinc-600 hover:border-white/20'}`}>
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-1">Payment Receipt / رسید</label>
                         <div className="relative group">
                            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <div className="w-full py-10 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center bg-zinc-900/20 group-hover:bg-zinc-900/40 group-hover:border-yellow-500/30 transition-all">
                               <div className="text-3xl mb-3">{file ? '✅' : '📷'}</div>
                               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{file ? file.name : 'Drop Receipt Image Here'}</span>
                            </div>
                         </div>
                      </div>

                      <button type="submit" disabled={isProcessing} className="w-full py-6 rounded-3xl btn-gold text-sm uppercase tracking-[0.5em] shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4 transition-all">
                        {isProcessing ? (
                           <>
                             <span className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></span>
                             <span>PROCESSING DATA...</span>
                           </>
                        ) : 'SECURE VIP ENTRY'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                  <h3 className="text-xl font-black italic gold-gradient">Payment Hub</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'JazzCash', owner: config.jazzCashName, val: config.jazzCash, color: 'text-yellow-500' },
                      { name: 'EasyPaisa', owner: config.easyPaisaName, val: config.easyPaisa, color: 'text-green-500' }
                    ].map((node, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all">
                         <div>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{node.name}</p>
                            <p className="text-[10px] font-black text-white mt-0.5">{node.owner}</p>
                         </div>
                         <p className={`text-sm font-black ${node.color} font-mono`}>{node.val}</p>
                      </div>
                    ))}
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                       <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Bank Node / IBAN</p>
                       <p className="text-[11px] font-black text-yellow-500 leading-none">{config.bankAccountName}</p>
                       <p className="text-xs font-mono text-zinc-400 break-all">{config.bankAccount}</p>
                    </div>
                  </div>
                </div>

                <div className="glass p-8 rounded-[2.5rem] border border-yellow-500/10 bg-gradient-to-br from-yellow-500/[0.03] to-transparent">
                  <h3 className="text-xl font-black italic gold-gradient mb-6">Agent Dashboard</h3>
                  {userReferralCode ? (
                    <div className="space-y-6 text-center">
                      <div className="p-5 rounded-2xl bg-black/60 border border-white/5 cursor-pointer group hover:border-yellow-500/40 transition-all" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/?ref=${userReferralCode}`);
                        addToast("Agent Link Copied", 'success');
                      }}>
                        <p className="text-[9px] font-black text-zinc-500 uppercase mb-2">My Agent Code</p>
                        <p className="text-2xl font-black text-white tracking-[0.2em]">{userReferralCode}</p>
                        <p className="text-[8px] text-yellow-500 font-black mt-3 uppercase tracking-tighter">Click to Copy Referral URL</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                          <span className="text-zinc-600">Referral Level</span>
                          <span className="text-yellow-500">{verifiedReferralCount} / {config.referralRequirement} Active</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                          <div className="h-full bg-yellow-500 shadow-[0_0_15px_#ca8a04]" style={{ width: `${Math.min((verifiedReferralCount/config.referralRequirement)*100, 100)}%` }}></div>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold italic leading-relaxed">
                          Reach level {config.referralRequirement} to receive a complimentary VIP ticket.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600 italic text-center">Referral engine activates after first successful entry.</p>
                  )}
                </div>

                {luckyMantra && (
                  <div className="glass p-8 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 text-center animate-in zoom-in duration-500">
                    <p className="text-[9px] font-black uppercase text-indigo-400 mb-3 tracking-[0.4em]">Prophetic Blessing</p>
                    <p className="text-base font-medium italic text-indigo-100 leading-relaxed font-serif">"{luckyMantra}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="glass p-10 rounded-[3rem] border border-white/5 space-y-6 shadow-2xl">
               <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h3 className="text-2xl font-black italic font-luxury text-white">The Aura Journal</h3>
                  <span className="text-[10px] font-black text-zinc-600 uppercase">Daily Records & Breaking News</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                  {newsArchive.length > 0 ? newsArchive.map((news, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border ${news.isBreaking ? 'border-yellow-500/20 bg-yellow-500/[0.02]' : 'border-white/5 bg-white/[0.01]'}`}>
                       <div className="flex justify-between items-start mb-2">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${news.isBreaking ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                             {news.isBreaking ? 'Breaking' : 'Update'}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-600">{new Date(news.timestamp).toLocaleTimeString()}</span>
                       </div>
                       <p className="text-xs font-bold text-zinc-300">{news.text}</p>
                    </div>
                  )) : (
                    <p className="col-span-full text-center text-xs text-zinc-700 py-10 italic">Journal is empty. Check back for live updates.</p>
                  )}
               </div>
            </div>
          </>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-16 border-t border-white/5 mt-20 text-center">
         <div className="flex justify-center gap-10 mb-8">
            {['Verify', 'Security', 'Policy', 'Support'].map(f => (
              <span key={f} className="text-[10px] font-black text-zinc-700 uppercase tracking-widest hover:text-white transition-colors cursor-pointer">{f}</span>
            ))}
         </div>
         <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.8em]">Aura Platinum Hub • Verified Node Sync © 2024</p>
      </footer>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="glass max-w-sm w-full p-12 rounded-[3.5rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-yellow-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                </div>
                <h3 className="text-3xl font-black text-white tracking-tighter mb-2 italic">MASTER LINK</h3>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Administrative Authority Required</p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <input type="email" placeholder="Terminal ID" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4.5 text-xs text-white outline-none focus:border-yellow-500/40" />
              <input type="password" placeholder="Key Code" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4.5 text-xs text-white outline-none focus:border-yellow-500/40" />
              <button type="submit" className="btn-gold w-full py-5 rounded-2xl text-[11px] uppercase tracking-[0.4em] font-black hover:scale-[1.03] active:scale-[0.98] transition-all shadow-2xl shadow-yellow-500/20">Authenticate</button>
              <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full text-[10px] text-zinc-700 font-black uppercase tracking-widest mt-4 hover:text-zinc-500 transition-colors">Abort Terminal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
