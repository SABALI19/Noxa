import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const ProgressChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { date: 'Jan', value: 2, progress: 8 },
    { date: 'Feb', value: 4, progress: 17 },
    { date: 'Mar', value: 6, progress: 25 },
    { date: 'Apr', value: 8, progress: 33 },
    { date: 'May', value: 10, progress: 42 },
    { date: 'Jun', value: 12, progress: 50 },
    { date: 'Jul', value: 14, progress: 58 },
    { date: 'Aug', value: 16, progress: 67 },
    { date: 'Sep', value: 18, progress: 75 },
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#666" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#666" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => {
              if (name === 'value') return [`${value}`, 'Value'];
              if (name === 'progress') return [`${value}%`, 'Progress'];
              return [value, name];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3D9B9B" 
            strokeWidth={2}
            dot={{ 
              r: 4, 
              strokeWidth: 2, 
              stroke: '#3D9B9B', 
              fill: 'white' 
            }}
            activeDot={{ 
              r: 6, 
              stroke: '#3D9B9B', 
              strokeWidth: 2, 
              fill: 'white' 
            }}
          />
          <Line 
            type="monotone" 
            dataKey="progress" 
            stroke="#4caf93" 
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={{ 
              r: 3, 
              strokeWidth: 2, 
              stroke: '#4caf93', 
              fill: 'white' 
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;