import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  plannedMargin: number;
  actualMargin: number;
  projectName: string;
}

export default function MarginTrendChart({ plannedMargin, actualMargin, projectName }: Props) {
  const data = [
    { name: projectName, planned: plannedMargin, actual: actualMargin },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Margin: Planned vs Actual</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            formatter={(value: number) => [`${value}%`]}
          />
          <Legend />
          <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '40% threshold', position: 'right', fontSize: 10, fill: '#ef4444' }} />
          <Bar dataKey="planned" name="Planned Margin" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={80} />
          <Bar dataKey="actual" name="Actual Margin" fill={actualMargin >= 40 ? '#22c55e' : actualMargin >= 35 ? '#eab308' : '#ef4444'} radius={[4, 4, 0, 0]} maxBarSize={80} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
