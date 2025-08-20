
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

const UserForm: React.FC<{ user?: User | null; onSave: (user: Omit<User, 'id' | 'createdAt'>) => void; onCancel: () => void }> = ({ user, onSave, onCancel }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role: user?.role || UserRole.STAFF,
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
            <Input label={t('name')} name="name" value={formData.name} onChange={handleChange} required />
            <Input label={t('email')} name="email" type="email" value={formData.email} onChange={handleChange} required />
            <Input label={t('password')} name="password" type="password" placeholder={user ? t('leave_blank_password') : ''} onChange={handleChange} required={!user} />
            <div>
                <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('role')}</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                    <option value={UserRole.ADMIN}>{t('admin')}</option>
                    <option value={UserRole.STAFF}>{t('staff')}</option>
                    <option value={UserRole.MANAGER}>{t('manager')}</option>
                    <option value={UserRole.SUPERVISOR}>{t('supervisor')}</option>
                    <option value={UserRole.ACCOUNTANT}>{t('accountant')}</option>
                    <option value={UserRole.SALES}>{t('sales')}</option>
                    <option value={UserRole.PRODUCER}>{t('producer')}</option>
                </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('cancel')}</Button>
                <Button type="submit">{t('save_user')}</Button>
            </div>
        </form>
    );
};

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const { t } = useTranslation();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<User[]>('/users');
            setUsers(response.data.filter(u => u.role !== UserRole.CUSTOMER));
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSaveUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, userData);
            } else {
                await api.post('/users', userData);
            }
            fetchUsers();
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Failed to save user", error);
        }
    };
    
    const handleDeleteUser = async (id: number) => {
        if (window.confirm(t('confirm_delete_user'))) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (error) {
                console.error("Failed to delete user", error);
            }
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' as keyof User },
        { header: t('name'), accessor: 'name' as keyof User },
        { header: t('email'), accessor: 'email' as keyof User },
        { header: t('role'), accessor: (item: User) => t(item.role) },
        { header: t('created_at'), accessor: (item: User) => new Date(item.createdAt).toLocaleDateString() },
    ];

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;

    return (
        <Card
            title={t('users_management')}
            actions={
                <Button onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    {t('add_user')}
                </Button>
            }
        >
            <Table<User>
                columns={columns}
                data={users}
                renderActions={(user) => (
                    <div className="space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => { setEditingUser(user); setIsModalOpen(true); }}>{t('edit')}</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteUser(user.id)}>{t('delete')}</Button>
                    </div>
                )}
            />
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? t('edit_user') : t('add_new_user')}>
                <UserForm user={editingUser} onSave={handleSaveUser} onCancel={() => { setIsModalOpen(false); setEditingUser(null); }} />
            </Modal>
        </Card>
    );
};

export default Users;