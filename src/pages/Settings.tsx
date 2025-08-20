import { useEffect, useState, useCallback, type FC, type ChangeEvent, type FormEvent } from 'react';
import api from '../services/api';
import { ShopInfo, UserRole } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';

const Settings: FC = () => {
    const { user } = useAuth();
    const { t, language, setLanguage } = useTranslation();
    const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const isAdmin = user?.role === UserRole.ADMIN;

    const fetchShopInfo = useCallback(async () => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await api.getShopInfo();
            setShopInfo(response);
        } catch (error) {
            console.error("Failed to fetch shop info", error);
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchShopInfo();
    }, [fetchShopInfo]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!shopInfo) return;
        const { name, value } = e.target;
        setShopInfo(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!shopInfo) return;
        setIsSaving(true);
        try {
            await api.updateShopInfo(shopInfo);
            alert("Shop info updated successfully!");
        } catch (error) {
            console.error("Failed to save shop info", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <Card title={t('language_settings')}>
                 <div>
                    <label htmlFor="language" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        {t('language')}
                    </label>
                    <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full max-w-xs p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    >
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                    </select>
                </div>
            </Card>

            {isAdmin && (
                loading ? (
                    <div className="flex justify-center p-8"><Spinner /></div>
                ) : shopInfo ? (
                     <Card title={t('shop_settings')}>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input 
                                label={t('shop_name')} 
                                name="name" 
                                value={shopInfo.name} 
                                onChange={handleChange} 
                                required 
                            />
                            <div>
                                <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('address')}</label>
                                <textarea 
                                    id="address" 
                                    name="address" 
                                    rows={4} 
                                    value={shopInfo.address} 
                                    onChange={handleChange} 
                                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                                    required
                                ></textarea>
                            </div>
                            <Input 
                                label={t('phone')} 
                                name="phone" 
                                value={shopInfo.phone} 
                                onChange={handleChange} 
                                required 
                            />
                             <div>
                                <label htmlFor="invoiceFooter" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('invoice_footer_message')}</label>
                                <textarea 
                                    id="invoiceFooter" 
                                    name="invoiceFooter" 
                                    rows={3} 
                                    value={shopInfo.invoiceFooter} 
                                    onChange={handleChange} 
                                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                    required
                                ></textarea>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? t('saving') : t('save_changes')}
                                </Button>
                            </div>
                        </form>
                    </Card>
                ) : (
                    <Card title="Error"><p>{t('error_loading_shop_info')}</p></Card>
                )
            )}
        </div>
    );
};

export default Settings;