import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PracticeCapacity {
  practice: string;
  headcount: number;
  avgUtilization: number;
  overAllocated: number;
  underUtilized: number;
  onBench: number;
}

interface Props {
  data: PracticeCapacity[];
}

export default function PracticeView({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Utilization by Practice</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="practice" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Avg Utilization']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Bar
              dataKey="avgUtilization"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Practice</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Headcount</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Avg Utilization</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Over-Allocated</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Under-Utilized</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">On Bench</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((p) => (
              <tr key={p.practice}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.practice}</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-center">{p.headcount}</td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={
                    p.avgUtilization > 100 ? 'text-red-600 font-medium' :
                    p.avgUtilization >= 80 ? 'text-yellow-600 font-medium' :
                    'text-green-600 font-medium'
                  }>
                    {p.avgUtilization}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {p.overAllocated > 0 ? (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">{p.overAllocated}</span>
                  ) : <span className="text-gray-400">0</span>}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {p.underUtilized > 0 ? (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">{p.underUtilized}</span>
                  ) : <span className="text-gray-400">0</span>}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {p.onBench > 0 ? (
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">{p.onBench}</span>
                  ) : <span className="text-gray-400">0</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
