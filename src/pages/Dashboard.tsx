
import React, { useEffect, useState } from 'react';
import DashboardCard from '../components/DashboardCard';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import { Order, Product, User, UserRole } from '../types';
import { useTranslation } from '../hooks/useTranslation';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({ users: 0, customers: 0, products: 0, orders: 0, sales: 0 });
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, productsRes, ordersRes] = await Promise.all([
                    api.get<User[]>('/users'),
                    api.get<Product[]>('/products'),
                    api.get<Order[]>('/orders'),
                ]);
                
                const totalSales = ordersRes.data
                    .reduce((acc, order) => acc + order.amountPaid, 0);

                const totalCustomers = usersRes.data.filter(u => u.role === UserRole.CUSTOMER).length;

                setStats({
                    users: usersRes.data.length,
                    customers: totalCustomers,
                    products: productsRes.data.length,
                    orders: ordersRes.data.length,
                    sales: totalSales
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">{t('dashboard')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <DashboardCard 
                    title={t('total_sales')}
                    value={`${stats.sales.toFixed(2)} EGP`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                    color="bg-green-500"
                />
                <DashboardCard 
                    title={t('total_orders')}
                    value={stats.orders}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                    color="bg-blue-500"
                />
                 <DashboardCard 
                    title={t('total_customers')}
                    value={stats.customers}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    color="bg-teal-500"
                />
                <DashboardCard 
                    title={t('total_products')}
                    value={stats.products}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                    color="bg-purple-500"
                />
                <DashboardCard 
                    title={t('total_users')}
                    value={stats.users}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>}
                    color="bg-yellow-500"
                />
            </div>
            <div className="mt-8">
                {/* Future implementation: Add recent orders or a quick report chart here */}
            </div>
        </div>
    );
};

export default Dashboard;
