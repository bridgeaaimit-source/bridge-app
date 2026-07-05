"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const getScoreColor = (score) => {
  if (score >= 80) return "#0D9488"; // brand primary
  if (score >= 60) return "#FF6B35"; // brand secondary
  return "#EF4444"; // red
};

export default function MatchPieChart({ matchScore }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={[
            { value: matchScore },
            { value: 100 - matchScore }
          ]}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={65}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
        >
          <Cell fill={getScoreColor(matchScore)} />
          <Cell fill="#F1F5F9" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
