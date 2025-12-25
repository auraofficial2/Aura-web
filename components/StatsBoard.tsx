
import React, { useEffect, useState } from 'react';
import { PrizeStats, PrizeType, AppConfig } from '../types';
import { getConfig } from '../services/mockStore';

interface StatsBoardProps {
  stats: PrizeStats;
}

export const StatsBoard: React.FC<StatsBoardProps> = ({ stats }) => {
  const config = getConfig();
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  
  const prizeDetails = [
    { type: PrizeType.MOBILE, label: 'Fun Mobile / اسمارٹ فون', icon: '📱' },
    { type: PrizeType.BIKE, label: 'Motorbike / موٹر سائیکل', icon: '🏍' },
    { type: PrizeType.FAN, label: 'Exhaust Fan / پنکھا', icon: '🌀' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLastSync(new Date().toLocaleTimeString());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const mobilePercent = stats.total > 0 ? (stats.mobileDeviceCount / stats.total) * 100 : 0;
  const desktopPercent = stats.total > 0 ? (stats.desktopDeviceCount / stats.total) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Device Breakdown Visualizer */}
      <div className="glass p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex-1 space-y-2">
              <h3 className="text-xl font-black italic gold-gradient">Participation Network</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Live Traffic Analysis / ٹریفک رپورٹ</p>
           </div>
           <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between text-[9px] font-black uppercase">
                 <span className="text-zinc-400 flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                   Mobile ({Math.round(mobilePercent)}%)
                 </span>
                 <span className="text-zinc-400 flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                   Desktop ({Math.round(desktopPercent)}%)
                 </span>
              </div>
              <div className="h-4 bg-zinc-900/50 rounded-full flex overflow-hidden border border-white/5 p-0.5">
                 <div className="h-full bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(202,138,4,0.4)] transition-all duration-1000" style={{ width: `${mobilePercent}%` }}></div>
                 <div className="h-full bg-zinc-800 rounded-full transition-all duration-1000" style={{ width: `${desktopPercent}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                 <p className="text-[10px] font-bold text-zinc-500 italic">Thousands of users are currently browsing from mobile phones...</p>
                 <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/40 animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/20 animate-pulse delay-150"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-black italic font-luxury gold-gradient">Live Prize Showcase</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Real-time prize pool distribution</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-lg flex items-center gap-2">
           <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">Sync: {lastSync}</span>
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {prizeDetails.map(prize => (
          <div key={prize.type} className="glass rounded-[2rem] overflow-hidden border border-white/5 group hover:border-yellow-500/30 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-yellow-500/5">
            <div className="h-48 relative overflow-hidden">
              <img 
                src={config.prizeImages[prize.type]} 
                alt={prize.type} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] leading-none mb-1">{prize.type === PrizeType.MOBILE ? 'Fun Mobile' : prize.type}</p>
                <p className="text-sm font-black text-white">{prize.label}</p>
              </div>
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-black group-hover:bg-yellow-500 group-hover:text-black transition-all">
                {prize.icon}
              </div>
            </div>
            <div className="p-5 flex justify-between items-center bg-white/[0.02]">
               <div>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Active Tickets</p>
                  <p className="text-2xl font-black text-white leading-none mt-1">{stats[prize.type]}</p>
               </div>
               <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-yellow-500/80 shadow-[0_0_8px_rgba(202,138,4,0.5)] transition-all duration-1000" style={{ width: `${Math.min((stats[prize.type]/100)*100, 100)}%` }}></div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
