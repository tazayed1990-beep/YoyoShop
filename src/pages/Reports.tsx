
import { useEffect, useState, useCallback, useMemo, type FC } from 'react';
import api from '../services/api';
import { Product, SalesReportData, Order, OrderStatus } from '../types';
import SalesChart from '../components/SalesChart';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { useTranslation } from '../hooks/useTranslation';

const Reports: FC = () => {
    const [salesData, setSalesData] = useState<SalesReportData[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [statuses, setStatuses] = useState<OrderStatus[]>([]);
    const [loadingSales, setLoadingSales] = useState(true);
    const [loadingStock, setLoadingStock] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [salesPeriod, setSalesPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
    const { t } = useTranslation();

    const fetchSalesData = useCallback(async () => {
        setLoadingSales(true);
        try {
            const response = await api.get<SalesReportData[]>(`/reports/sales?period=${salesPeriod}`);
            setSalesData(response.data);
        } catch (error) {
            console.error("Failed to fetch sales data", error);
        } finally {
            setLoadingSales(false);
        }
    }, [salesPeriod]);

    const fetchOtherData = useCallback(async () => {
        setLoadingStock(true);
        setLoadingHistory(true);
        try {
            const [stockRes, ordersRes, statusesRes] = await Promise.all([
                 api.get<Product[]>('/reports/low-stock'),
                 api.get<Order[]>('/orders'),
                 api.get<OrderStatus[]>('/statuses'),
            ]);
            setLowStockProducts(stockRes.data);
            setAllOrders(ordersRes.data);
            setStatuses(statusesRes.data);
        } catch (error) {
            console.error("Failed to fetch report data", error);
        } finally {
            setLoadingStock(false);
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        fetchSalesData();
        fetchOtherData();
    }, [salesPeriod, fetchSalesData, fetchOtherData]);
    
    const statusColorMap = useMemo(() => {
        const map: { [key: string]: string } = {};
        const colorVariants: { [key: string]: string } = {
            yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
            purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
            gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        };
        statuses.forEach(s => {
            map[s.name] = colorVariants[s.color] || colorVariants.gray;
        });
        return map;
    }, [statuses]);

    const lowStockColumns = [
        { header: t('product_id'), accessor: 'id' as keyof Product },
        { header: t('product_name'), accessor: 'name' as keyof Product },
        { header: t('stock_left'), accessor: 'stockQuantity' as keyof Product },
    ];

    const historyColumns = [
        { header: t('order_id'), accessor: 'id' as keyof Order },
        { header: t('customer'), accessor: (item: Order) => <span className={item.deleted ? 'line-through' : ''}>{item.user?.name || `User ID: ${item.userId}`}</span>},
        { header: t('status'), accessor: (item: Order) => (
             item.deleted 
             ? <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColorMap['red']}`}>{t('deleted')}</span>
             : <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColorMap[item.status] || ''}`}>{item.status}</span>
        )},
        { header: t('total_amount'), accessor: (item: Order) => <span className={item.deleted ? 'line-through' : ''}>{`${item.totalAmount.toFixed(2)} EGP`}</span> },
        { header: t('date'), accessor: (item: Order) => <span className={item.deleted ? 'line-through' : ''}>{new Date(item.createdAt).toLocaleDateString()}</span> },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">{t('reports_title')}</h1>
            <div className="space-y-8">
                <Card>
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('sales_report')}</h2>
                        <select
                            value={salesPeriod}
                            onChange={(e) => setSalesPeriod(e.target.value as any)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="daily">{t('daily')}</option>
                            <option value="monthly">{t('monthly')}</option>
                            <option value="yearly">{t('yearly')}</option>
                        </select>
                    </div>
                    {loadingSales ? <Spinner /> : <SalesChart data={salesData} title={t('sales_chart_title', { period: t(salesPeriod) })} />}
                </Card>
                
                <Card title={t('transaction_history')}>
                    {loadingHistory ? <Spinner /> : <Table<Order> columns={historyColumns} data={allOrders} />}
                </Card>

                <Card title={t('low_stock_products')}>
                    {loadingStock ? <Spinner /> : <Table<Product> columns={lowStockColumns} data={lowStockProducts} />}
                </Card>
            </div>
        </div>
    );
};

export default Reports;