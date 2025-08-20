import type { FC, ReactNode } from 'react';
import Card from './ui/Card';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  subtitle?: string;
}

const DashboardCard: FC<DashboardCardProps> = ({ title, value, icon, color, subtitle }) => {
  return (
    <Card className="shadow-lg">
      <div className="flex items-center">
        <div className={`p-3 rounded-full me-4 ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
};

export default DashboardCard;