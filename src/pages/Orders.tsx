
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Order, OrderStatus, Product, User, UserRole } from '../types';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useTranslation } from '../hooks/useTranslation';

// Form for updating an existing order's status and payment
const EditOrderForm: React.FC<{ order: Order; statuses: OrderStatus[], onSave: (orderId: number, data: { status: string; amountPaid: number }) => void; onCancel: () => void; }> = ({ order, statuses, onSave, onCancel }) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<string>(order.status);
    const [amountPaid, setAmountPaid] = useState<number>(order.amountPaid);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(order.id, { status, amountPaid: Number(amountPaid) });
    };

    const remainingAmount = order.totalAmount - amountPaid;

    return (
        <form onSubmit={handleSubmit}>
            <p className="mb-1">{t('customer')}: {order.user?.name || 'N/A'} (ID: {order.userId})</p>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t('date')}: {new Date(order.createdAt).toLocaleString()}</p>
            
            <div className="mb-4">
                <h4 className="font-semibold mb-2">{t('items')}:</h4>
                <ul className="max-h-32 overflow-y-auto pe-2">
                    {order.orderItems.map(item => (
                        <li key={item.id} className="text-sm flex justify-between">
                            <span>{item.quantity} x {item.product?.name || `Product ID ${item.productId}`}</span>
                            <span>{item.price.toFixed(2)} EGP</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-lg border-t border-b dark:border-gray-600 py-4 my-4">
                <p><span className="font-semibold text-sm block text-gray-500 dark:text-gray-400">{t('total')}</span> {order.totalAmount.toFixed(2)} EGP</p>
                <p><span className="font-semibold text-sm block text-gray-500 dark:text-gray-400">{t('amount_paid')}</span> {Number(amountPaid).toFixed(2)} EGP</p>
                <p className={`${remainingAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    <span className="font-semibold text-sm block text-gray-500 dark:text-gray-400">{t('remaining')}</span>
                     {remainingAmount.toFixed(2)} EGP
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('status')}</label>
                    <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                        {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                 <Input 
                    label={t('amount_paid')}
                    id="amountPaid"
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    min="0"
                    max={order.totalAmount}
                />
            </div>

            <div className="flex justify-end space-x-2 pt-6">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('cancel')}</Button>
                <Button type="submit">{t('update_order')}</Button>
            </div>
        </form>
    );
};

// Form for creating a new order
const AddOrderForm: React.FC<{ customers: User[]; products: Product[]; statuses: OrderStatus[]; onSave: (orderData: any) => void; onCancel: () => void; }> = ({ customers, products, statuses, onSave, onCancel }) => {
    const { t } = useTranslation();
    const [userId, setUserId] = useState<number | ''>('');
    const [status, setStatus] = useState<string>(statuses[0]?.name || '');
    const [items, setItems] = useState<{productId: number; quantity: number; name: string; price: number}[]>([]);
    const [currentItem, setCurrentItem] = useState<{productId: string; quantity: number}>({ productId: '', quantity: 1 });
    const [amountPaid, setAmountPaid] = useState<number>(0);

    const totalAmount = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }, [items]);

    const handleAddItem = () => {
        if (!currentItem.productId || currentItem.quantity <= 0) return;
        
        const product = products.find(p => p.id === parseInt(currentItem.productId));
        if (!product) return;

        setItems(prevItems => {
            const existingItem = prevItems.find(i => i.productId === product.id);
            if (existingItem) {
                return prevItems.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + currentItem.quantity } : i);
            } else {
                return [...prevItems, { productId: product.id, quantity: currentItem.quantity, name: product.name, price: product.price }];
            }
        });
        setCurrentItem({ productId: '', quantity: 1 });
    };

    const handleRemoveItem = (productId: number) => {
        setItems(prev => prev.filter(item => item.productId !== productId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || items.length === 0) {
            alert(t('alert_select_customer_and_item'));
            return;
        }
        onSave({ userId, status, items: items.map(({productId, quantity}) => ({productId, quantity})), amountPaid: Number(amountPaid) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="customer" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('customer_id_label')}</label>
                <select id="customer" value={userId} onChange={e => setUserId(parseInt(e.target.value))} required className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                    <option value="" disabled>{t('select_customer')}</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
             {/* Add Items Section */}
            <div className="border-t border-b border-gray-200 dark:border-gray-600 py-4">
                <h4 className="font-semibold mb-2">{t('order_items')}</h4>
                <div className="flex items-end space-x-2">
                    <div className="flex-grow">
                        <label htmlFor="product" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('product')}</label>
                        <select id="product" value={currentItem.productId} onChange={e => setCurrentItem(prev => ({...prev, productId: e.target.value}))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                            <option value="" disabled>{t('select_product')}</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.price.toFixed(2)} EGP) - {t('stock')}: {p.stockQuantity}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor="quantity" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('qty')}</label>
                        <Input id="quantity" type="number" value={currentItem.quantity} onChange={e => setCurrentItem(prev => ({...prev, quantity: Math.max(1, parseInt(e.target.value))}))} className="w-20" min="1" />
                    </div>
                    <Button type="button" onClick={handleAddItem}>{t('add')}</Button>
                </div>
            </div>

            {/* Items List */}
            {items.length > 0 && (
                <div>
                    <ul className="space-y-2 max-h-40 overflow-y-auto pe-2">
                        {items.map(item => (
                            <li key={item.productId} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-600 rounded-md">
                                <span>{item.quantity} x {item.name}</span>
                                <span>{(item.price * item.quantity).toFixed(2)} EGP</span>
                                <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveItem(item.productId)}>X</Button>
                            </li>
                        ))}
                    </ul>
                    <p className="text-end font-bold text-lg mt-2">{t('total')}: {totalAmount.toFixed(2)} EGP</p>
                </div>
            )}
           
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('initial_status')}</label>
                    <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                        {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                <Input
                    label={t('deposit_amount_paid')}
                    id="amountPaid"
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={e => setAmountPaid(Number(e.target.value))}
                    min="0"
                />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('cancel')}</Button>
                <Button type="submit">{t('create_order')}</Button>
            </div>
        </form>
    )
};


const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [statuses, setStatuses] = useState<OrderStatus[]>([]);
    const [customers, setCustomers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [ordersRes, statusesRes, usersRes, productsRes] = await Promise.all([
                api.get<Order[]>('/orders'),
                api.get<OrderStatus[]>('/statuses'),
                api.get<User[]>('/users'),
                api.get<Product[]>('/products'),
            ]);
            setOrders(ordersRes.data);
            setStatuses(statusesRes.data);
            setCustomers(usersRes.data.filter(u => u.role === UserRole.CUSTOMER));
            setProducts(productsRes.data);
        } catch (error) {
            console.error("Failed to fetch order data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleUpdateOrder = async (orderId: number, data: { status: string; amountPaid: number }) => {
        try {
            await api.put(`/orders/${orderId}`, data);
            fetchData();
            setIsEditModalOpen(false);
            setSelectedOrder(null);
        } catch (error) {
            console.error("Failed to update order", error);
        }
    };

    const handleAddOrder = async (orderData: any) => {
        try {
            await api.post('/orders', orderData);
            fetchData();
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Failed to create order", error);
        }
    }
    
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

    const columns = [
        { header: t('order_id'), accessor: 'id' as keyof Order },
        { header: t('customer'), accessor: (item: Order) => item.user?.name || `User ID: ${item.userId}`},
        { header: t('status'), accessor: (item: Order) => (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColorMap[item.status] || ''}`}>
                {item.status}
            </span>
        )},
        { header: t('total_amount'), accessor: (item: Order) => `${item.totalAmount.toFixed(2)} EGP` },
        { header: t('amount_paid'), accessor: (item: Order) => `${item.amountPaid.toFixed(2)} EGP` },
        { header: t('remaining'), accessor: (item: Order) => {
            const remaining = item.totalAmount - item.amountPaid;
            const color = remaining > 0 ? 'text-red-500' : 'text-green-500';
            return <span className={color}>{remaining.toFixed(2)} EGP</span>
        }},
        { header: t('date'), accessor: (item: Order) => new Date(item.createdAt).toLocaleDateString() },
    ];

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;

    return (
        <Card title={t('orders_management')} actions={
            <Button onClick={() => setIsAddModalOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                {t('add_order')}
            </Button>
        }>
            <Table<Order>
                columns={columns}
                data={orders}
                renderActions={(order) => (
                    <div className="flex space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => { setSelectedOrder(order); setIsEditModalOpen(true); }}>{t('view_edit')}</Button>
                        <Button size="sm" variant="secondary" onClick={() => navigate(`/invoice/${order.id}`)}>{t('print_invoice')}</Button>
                    </div>
                )}
            />
            {selectedOrder && (
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('order_details', { id: selectedOrder.id })}>
                    <EditOrderForm order={selectedOrder} statuses={statuses} onSave={handleUpdateOrder} onCancel={() => { setIsEditModalOpen(false); setSelectedOrder(null); }}/>
                </Modal>
            )}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('create_new_order')}>
                <AddOrderForm customers={customers} products={products} statuses={statuses} onSave={handleAddOrder} onCancel={() => setIsAddModalOpen(false)} />
            </Modal>
        </Card>
    );
};

export default Orders;
