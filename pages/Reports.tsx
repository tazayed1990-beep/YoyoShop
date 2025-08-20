
import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Product, SalesReportData } from '../types';
import SalesChart from '../components/SalesChart';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { useTranslation } from '../hooks/useTranslation';

const Reports: React.FC = () => {
    const [salesData, setSalesData] = useState<SalesReportData[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [loadingSales, setLoadingSales] = useState(true);
    const [loadingStock, setLoadingStock] = useState(true);
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

    const fetchLowStockData = useCallback(async () => {
        setLoadingStock(true);
        try {
            const response = await api.get<Product[]>('/reports/low-stock');
            setLowStockProducts(response.data);
        } catch (error) {
            console.error("Failed to fetch low stock data", error);
        } finally {
            setLoadingStock(false);
        }
    }, []);

    useEffect(() => {
        fetchSalesData();
        fetchLowStockData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [salesPeriod]);


    const lowStockColumns = [
        { header: t('product_id'), accessor: 'id' as keyof Product },
        { header: t('product_name'), accessor: 'name' as keyof Product },
        { header: t('stock_left'), accessor: 'stockQuantity' as keyof Product },
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

                <Card title={t('low_stock_products')}>
                    {loadingStock ? <Spinner /> : <Table<Product> columns={lowStockColumns} data={lowStockProducts} />}
                </Card>
            </div>
        </div>
    );
};

export default Reports;