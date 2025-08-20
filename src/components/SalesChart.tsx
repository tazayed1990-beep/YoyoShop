
import type { FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SalesReportData } from '../types';
import Card from './ui/Card';

interface SalesChartProps {
  data: SalesReportData[];
  title: string;
}

const SalesChart: FC<SalesChartProps> = ({ data, title }) => {
  return (
    <Card title={title}>
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{
                    top: 20, right: 30, left: 20, bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="period" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '0.5rem'
                        }} 
                        labelStyle={{ color: '#d1d5db' }}
                        itemStyle={{ color: '#60a5fa' }}
                    />
                    <Legend wrapperStyle={{ color: '#d1d5db' }}/>
                    <Bar dataKey="totalSales" fill="#3b82f6" name="Total Sales" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </Card>
  );
};

export default SalesChart;