
import React from 'react';
import { Winner, PrizeType } from '../types';
import { getConfig } from '../services/mockStore';

interface WinnerWallProps {
  winners: Winner[];
}

export const WinnerWall: React.FC<WinnerWallProps> = ({ winners }) => {
  const config = getConfig();

  if (winners.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-black italic font-luxury gold-gradient">Platinum Hall of Fame</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">انعامات جیتنے والوں کی فہرست</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-lg">
           <p className="text-[8px] font-black text-yellow-500 uppercase tracking-tighter">Verified Success / تصدیق شدہ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {winners.map((winner) => (
          <div key={winner.id} className="glass rounded-2xl p-5 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/[0.03] to-transparent relative overflow-hidden group hover:border-yellow-500/40 transition-all duration-300">
             <div className="absolute top-0 right-0 p-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-sm">🏆</div>
             </div>
             
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-xl font-black text-yellow-500">
                   {winner.name.charAt(0)}
                </div>
                <div>
                   <h4 className="text-sm font-black text-white">{winner.name}</h4>
                   <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{winner.ticketNumber}</p>
                </div>
             </div>

             <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                <div>
                   <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Won / انعام</p>
                   <p className="text-[10px] font-black text-yellow-500 uppercase">{winner.prize === PrizeType.MOBILE ? 'Fun Mobile' : winner.prize}</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Date</p>
                   <p className="text-[9px] font-bold text-zinc-400">{new Date(winner.timestamp).toLocaleDateString()}</p>
                </div>
             </div>

             {/* Background glow on hover */}
             <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/[0.02] transition-colors pointer-events-none"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
