
import { useEffect, useState, useCallback, type FC, type ChangeEvent, type FormEvent } from 'react';
import api from '../services/api';
import { Product } from '../types';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';

const ProductForm: FC<{ product?: Product | null; onSave: (product: Omit<Product, 'id' | 'createdAt'>) => void; onCancel: () => void }> = ({ product, onSave, onCancel }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || 0,
        stockQuantity: product?.stockQuantity || 0,
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) : value 
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('product_name')} name="name" value={formData.name} onChange={handleChange} required />
            <div>
                <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{t('description')}</label>
                <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" required></textarea>
            </div>
            <Input label={t('price')} name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
            <Input label={t('stock_quantity')} name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} required />
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('cancel')}</Button>
                <Button type="submit">{t('save_product')}</Button>
            </div>
        </form>
    );
};

const Products: FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const { t } = useTranslation();

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<Product[]>('/products');
            setProducts(response.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSaveProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, productData);
            } else {
                await api.post('/products', productData);
            }
            fetchProducts();
            setIsModalOpen(false);
            setEditingProduct(null);
        } catch (error) {
            console.error("Failed to save product", error);
        }
    };
    
    const handleDeleteProduct = async (id: number) => {
        if (window.confirm(t('confirm_delete_product'))) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (error) {
                console.error("Failed to delete product", error);
            }
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' as keyof Product },
        { header: t('name'), accessor: 'name' as keyof Product },
        { header: t('price'), accessor: (item: Product) => `${item.price.toFixed(2)} EGP` },
        { header: t('stock'), accessor: 'stockQuantity' as keyof Product },
        { header: t('created_at'), accessor: (item: Product) => new Date(item.createdAt).toLocaleDateString() },
    ];

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;

    return (
        <Card
            title={t('products_management')}
            actions={
                <Button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    {t('add_product')}
                </Button>
            }
        >
            <Table<Product>
                columns={columns}
                data={products}
                renderActions={(product) => (
                    <div className="space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}>{t('edit')}</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteProduct(product.id)}>{t('delete')}</Button>
                    </div>
                )}
            />
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? t('edit_product') : t('add_new_product')}>
                <ProductForm product={editingProduct} onSave={handleSaveProduct} onCancel={() => { setIsModalOpen(false); setEditingProduct(null); }} />
            </Modal>
        </Card>
    );
};

export default Products;