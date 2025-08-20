
import { useEffect, useState, useCallback, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Order, ShopInfo } from '../types';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { useTranslation } from '../hooks/useTranslation';

const Invoice: FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const { t, language } = useTranslation();

    const fetchData = useCallback(async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const [orderRes, shopInfoRes] = await Promise.all([
                api.get<Order>(`/orders/${orderId}`),
                api.get<ShopInfo>('/shop-info')
            ]);
            setOrder(orderRes.data);
            setShopInfo(shopInfoRes.data);
        } catch (error) {
            console.error(`Failed to fetch invoice data for order ${orderId}`, error);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><Spinner /></div>;
    }

    if (!order || !shopInfo) {
        return <div className="flex items-center justify-center h-screen bg-gray-100">Order or Shop Information not found.</div>;
    }

    const subtotal = order.totalAmount;
    const remaining = order.totalAmount - order.amountPaid;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen p-4 sm:p-8">
            <style>{`
                @media print {
                    .print-hidden {
                        display: none;
                    }
                    body {
                        background-color: #fff !important;
                        color: #000 !important;
                    }
                    .dark\\:bg-gray-800, .dark\\:bg-gray-700, .dark\\:bg-gray-900 {
                        background-color: #fff !important;
                    }
                    .dark\\:text-white, .dark\\:text-gray-200, .dark\\:text-gray-300 {
                        color: #000 !important;
                    }
                    .dark\\:text-gray-400 {
                        color: #555 !important;
                    }
                    .dark\\:border-gray-700 {
                         border-color: #ddd !important;
                    }
                }
            `}</style>
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <div className="print-hidden flex justify-between mb-8">
                    <Button variant="secondary" onClick={() => navigate('/orders')}>
                        {language === 'ar' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        )}
                        {t('back_to_orders')}
                    </Button>
                    <Button onClick={() => window.print()}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-8V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        {t('print_invoice')}
                    </Button>
                </div>
                
                {/* Header */}
                <header className="flex justify-between items-start pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{shopInfo.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400 whitespace-pre-line">{shopInfo.address}</p>
                        <p className="text-gray-500 dark:text-gray-400">{shopInfo.phone}</p>
                    </div>
                    <div className="text-end">
                        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">{t('invoice')}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{t('invoice_number', { id: order.id })}</p>
                        <p className="text-gray-500 dark:text-gray-400">{t('invoice_date')} {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                </header>

                {/* Customer Info */}
                <section className="grid grid-cols-2 gap-8 my-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('bill_to')}</h3>
                        <p className="font-bold text-gray-800 dark:text-white">{order.user?.name}</p>
                        <p className="text-gray-600 dark:text-gray-300">{order.user?.address}</p>
                        <p className="text-gray-600 dark:text-gray-300">{order.user?.phone}</p>
                        <p className="text-gray-600 dark:text-gray-300">{order.user?.email}</p>
                    </div>
                </section>

                {/* Items Table */}
                <section>
                    <table className="w-full text-start">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                                <th className="p-3 font-semibold text-gray-600 dark:text-gray-300 text-start">{t('product_header')}</th>
                                <th className="p-3 font-semibold text-gray-600 dark:text-gray-300 text-center">{t('quantity_header')}</th>
                                <th className="p-3 font-semibold text-gray-600 dark:text-gray-300 text-end">{t('unit_price_header')}</th>
                                <th className="p-3 font-semibold text-gray-600 dark:text-gray-300 text-end">{t('total_header')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.orderItems.map(item => (
                                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="p-3">{item.product?.name}</td>
                                    <td className="p-3 text-center">{item.quantity}</td>
                                    <td className="p-3 text-end">{item.price.toFixed(2)} EGP</td>
                                    <td className="p-3 text-end">{(item.price * item.quantity).toFixed(2)} EGP</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Totals */}
                <section className="flex justify-end mt-8">
                    <div className="w-full sm:w-1/2 lg:w-1/3 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('subtotal')}</span>
                            <span className="font-semibold">{subtotal.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl border-t border-gray-200 dark:border-gray-700 pt-3">
                            <span>{t('total_invoice')}</span>
                            <span>{subtotal.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('amount_paid')}:</span>
                            <span className="font-semibold">{order.amountPaid.toFixed(2)} EGP</span>
                        </div>
                        <div className={`flex justify-between font-bold text-lg p-2 rounded ${remaining > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
                            <span>{t('balance_due')}</span>
                            <span>{remaining.toFixed(2)} EGP</span>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <p className="whitespace-pre-line">{shopInfo.invoiceFooter}</p>
                </footer>
            </div>
        </div>
    );
};

export default Invoice;
