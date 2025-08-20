
import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { OrderStatus } from '../types';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';

const availableColors = ['gray', 'red', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink'];

const StatusForm: React.FC<{ status?: OrderStatus | null; onSave: (status: Omit<OrderStatus, 'id'>) => void; onCancel: () => void }> = ({ status, onSave, onCancel }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: status?.name || '',
        color: status?.color || 'gray',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('status_name')} name="name" value={formData.name} onChange={handleChange} required />
            <div>
                <label htmlFor="color" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('color')}</label>
                <select id="color" name="color" value={formData.color} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                    {availableColors.map(color => <option key={color} value={color} className="capitalize">{color}</option>)}
                </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('cancel')}</Button>
                <Button type="submit">{t('save_status')}</Button>
            </div>
        </form>
    );
};

const Statuses: React.FC = () => {
    const [statuses, setStatuses] = useState<OrderStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState<OrderStatus | null>(null);
    const { t } = useTranslation();

    const fetchStatuses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<OrderStatus[]>('/statuses');
            setStatuses(response.data);
        } catch (error) {
            console.error("Failed to fetch statuses", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatuses();
    }, [fetchStatuses]);

    const handleSaveStatus = async (statusData: Omit<OrderStatus, 'id'>) => {
        try {
            if (editingStatus) {
                await api.put(`/statuses/${editingStatus.id}`, statusData);
            } else {
                await api.post('/statuses', statusData);
            }
            fetchStatuses();
            setIsModalOpen(false);
            setEditingStatus(null);
        } catch (error) {
            console.error("Failed to save status", error);
        }
    };
    
    const handleDeleteStatus = async (id: number) => {
        if (window.confirm(t('confirm_delete_status'))) {
            try {
                await api.delete(`/statuses/${id}`);
                fetchStatuses();
            } catch (error) {
                console.error("Failed to delete status", error);
            }
        }
    };

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

    const columns = [
        { header: 'ID', accessor: 'id' as keyof OrderStatus },
        { header: t('name'), accessor: (item: OrderStatus) => (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorVariants[item.color] || colorVariants.gray}`}>
                {item.name}
            </span>
        )},
        { header: t('color'), accessor: 'color' as keyof OrderStatus },
    ];

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;

    return (
        <Card
            title={t('statuses_management')}
            actions={
                <Button onClick={() => { setEditingStatus(null); setIsModalOpen(true); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    {t('add_status')}
                </Button>
            }
        >
            <Table<OrderStatus>
                columns={columns}
                data={statuses}
                renderActions={(status) => (
                    <div className="space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => { setEditingStatus(status); setIsModalOpen(true); }}>{t('edit')}</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteStatus(status.id)}>{t('delete')}</Button>
                    </div>
                )}
            />
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStatus ? t('edit_status') : t('add_new_status')}>
                <StatusForm status={editingStatus} onSave={handleSaveStatus} onCancel={() => { setIsModalOpen(false); setEditingStatus(null); }} />
            </Modal>
        </Card>
    );
};

export default Statuses;
