
import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { User, UserRole } from '../types';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';

const CustomerForm: React.FC<{ user?: User | null; onSave: (user: Omit<User, 'id' | 'createdAt' | 'role'>) => void; onCancel: () => void }> = ({ user, onSave, onCancel }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        address: user?.address || '',
        phone: user?.phone || '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('name')} name="name" value={formData.name} onChange={handleChange} required />
            <div>
                <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('address')}</label>
                <textarea id="address" name="address" rows={3} value={formData.address} onChange={handleChange} className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" required></textarea>
            </div>
            <Input label={t('phone')} name="phone" value={formData.phone} onChange={handleChange} required />
            <Input label={t('email_optional')} name="email" type="email" value={formData.email} onChange={handleChange} />
            <Input label={t('password')} name="password" type="password" placeholder={user ? t('leave_blank_password') : ''} onChange={handleChange} required={!user} />
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('cancel')}</Button>
                <Button type="submit">{t('save_customer')}</Button>
            </div>
        </form>
    );
};

const Customers: React.FC = () => {
    const [customers, setCustomers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<User | null>(null);
    const { t } = useTranslation();

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<User[]>('/users');
            setCustomers(response.data.filter(u => u.role === UserRole.CUSTOMER));
        } catch (error) {
            console.error("Failed to fetch customers", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleSaveCustomer = async (customerData: Omit<User, 'id' | 'createdAt' | 'role'>) => {
        const userData = { ...customerData, role: UserRole.CUSTOMER };
        try {
            if (editingCustomer) {
                await api.put(`/users/${editingCustomer.id}`, userData);
            } else {
                await api.post('/users', userData);
            }
            fetchCustomers();
            setIsModalOpen(false);
            setEditingCustomer(null);
        } catch (error) {
            console.error("Failed to save customer", error);
        }
    };
    
    const handleDeleteCustomer = async (id: number) => {
        if (window.confirm(t('confirm_delete_customer'))) {
            try {
                await api.delete(`/users/${id}`);
                fetchCustomers();
            } catch (error) {
                console.error("Failed to delete customer", error);
            }
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' as keyof User },
        { header: t('name'), accessor: 'name' as keyof User },
        { header: t('phone'), accessor: 'phone' as keyof User },
        { header: t('address'), accessor: 'address' as keyof User },
        { header: t('joined_at'), accessor: (item: User) => new Date(item.createdAt).toLocaleDateString() },
    ];

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;

    return (
        <Card
            title={t('customers_management')}
            actions={
                <Button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    {t('add_customer')}
                </Button>
            }
        >
            <Table<User>
                columns={columns}
                data={customers}
                renderActions={(customer) => (
                    <div className="space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}>{t('edit')}</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteCustomer(customer.id)}>{t('delete')}</Button>
                    </div>
                )}
            />
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? t('edit_customer') : t('add_new_customer')}>
                <CustomerForm user={editingCustomer} onSave={handleSaveCustomer} onCancel={() => { setIsModalOpen(false); setEditingCustomer(null); }} />
            </Modal>
        </Card>
    );
};

export default Customers;
