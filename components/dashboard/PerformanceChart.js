"use client";

import { 
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const diff = dataPoint.change || 0;
    const diffText = diff >= 0 ? `+${diff}` : `${diff}`;
    
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-[11px] font-bold shadow-xl border border-slate-800">
        <p className="text-slate-400 font-semibold">{label}</p>
        <p className="mt-1 flex items-center gap-1.5">
          Score: <span className="text-[#00C4A7] font-extrabold">{dataPoint.score}</span>
        </p>
        <p className="text-[10px] text-slate-400 font-medium">
          Change: <span className={diff >= 0 ? "text-[#00C4A7]" : "text-red-400"}>{diffText}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function PerformanceChart({ lineChartData, isOutOf1000, timeframe }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={lineChartData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00C4A7" stopOpacity={0.25}/>
            <stop offset="95%" stopColor="#00C4A7" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#cbd5e1" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          domain={isOutOf1000 ? [0, 1000] : [0, 100]} 
          ticks={isOutOf1000 ? [0, 250, 500, 750, 1000] : [0, 25, 50, 75, 100]}
          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="score" 
          stroke="#00C4A7" 
          strokeWidth={3} 
          fillOpacity={1} 
          fill="url(#colorScore)"
          dot={{ r: timeframe === 'week' ? 4 : 2, strokeWidth: 2, fill: "#fff" }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
