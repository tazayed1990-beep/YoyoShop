import { db, auth } from './firebase';
import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    query,
    where,
    Timestamp,
    orderBy
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { User, Product, Order, UserRole, OrderStatus, ShopInfo } from '../types';

// --- Helper Functions ---

/**
 * Converts a Firestore document snapshot to a typed object,
 * including the document ID and converting timestamps to ISO strings.
 */
const fromFirestore = <T>(snapshot: any): T => {
    const data = snapshot.data();
    const result: any = {
        ...data,
        id: snapshot.id,
    };
    // Convert all Timestamp fields to ISO strings
    for (const key in result) {
        if (result[key] instanceof Timestamp) {
            result[key] = result[key].toDate().toISOString();
        }
    }
    return result as T;
};

// --- API Functions ---

const api = {
    // --- Users ---
    async getUsers(): Promise<User[]> {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => fromFirestore<User>(doc));
    },

    async getUserProfile(uid: string): Promise<User | null> {
        const userDocRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return fromFirestore<User>(docSnap);
        }
        return null;
    },

    async createUser(userData: any): Promise<void> {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const { uid } = userCredential.user;
        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, {
            name: userData.name,
            email: userData.email,
            phone: userData.phone || '',
            address: userData.address || '',
            role: userData.role,
            createdAt: Timestamp.now(),
        });
    },

    async updateUser(id: string, data: Partial<User>): Promise<void> {
        const userDoc = doc(db, 'users', id);
        await updateDoc(userDoc, data);
    },

    async deleteUser(id: string): Promise<void> {
        // Note: This only deletes the Firestore record, not the Firebase Auth user.
        // Deleting auth users requires the Admin SDK (backend).
        await deleteDoc(doc(db, 'users', id));
    },

    // --- Products ---
    async getProducts(): Promise<Product[]> {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => fromFirestore<Product>(doc));
    },

    async createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<void> {
        await addDoc(collection(db, 'products'), {
            ...data,
            createdAt: Timestamp.now()
        });
    },

    async updateProduct(id: string, data: Partial<Product>): Promise<void> {
        await updateDoc(doc(db, 'products', id), data);
    },

    async deleteProduct(id: string): Promise<void> {
        await deleteDoc(doc(db, 'products', id));
    },
    
    // --- Orders ---
    async getOrders(): Promise<Order[]> {
        const ordersCol = collection(db, 'orders');
        const q = query(ordersCol, orderBy('createdAt', 'desc'));
        const orderSnapshot = await getDocs(q);
        
        const orders: Order[] = orderSnapshot.docs.map(doc => fromFirestore<Order>(doc));

        // In a large-scale app, denormalizing user/product names into orders is better.
        // For now, we fetch them to populate the data as the mock API did.
        const users = await this.getUsers();
        const products = await this.getProducts();
        const userMap = new Map(users.map(u => [u.id, u]));
        const productMap = new Map(products.map(p => [p.id, p]));

        return orders.map(order => {
            const populatedOrder: Order = {
                ...order,
                user: userMap.get(order.userId),
                orderItems: order.orderItems.map(item => ({
                    ...item,
                    product: productMap.get(item.productId)
                }))
            };
            return populatedOrder;
        });
    },
    
    async getOrder(id: string): Promise<Order | null> {
         const orderDocRef = doc(db, 'orders', id);
         const docSnap = await getDoc(orderDocRef);

         if (!docSnap.exists()) return null;

         const order = fromFirestore<Order>(docSnap);

         // Populate user and product data
         order.user = await this.getUserProfile(order.userId) ?? undefined;
         for (const item of order.orderItems) {
             const productDoc = await getDoc(doc(db, 'products', item.productId));
             if (productDoc.exists()) {
                 item.product = fromFirestore<Product>(productDoc);
             }
         }
         return order;
    },

    async createOrder(data: any): Promise<void> {
         await addDoc(collection(db, 'orders'), {
             ...data,
             deleted: false,
             createdAt: Timestamp.now()
         });
    },

    async updateOrder(id: string, data: Partial<Order>): Promise<void> {
        await updateDoc(doc(db, 'orders', id), data);
    },

    async deleteOrder(id: string): Promise<void> {
        // Soft delete
        await updateDoc(doc(db, 'orders', id), { deleted: true });
    },

    // --- Order Statuses ---
     async getStatuses(): Promise<OrderStatus[]> {
        const statusesCol = collection(db, 'statuses');
        const snapshot = await getDocs(statusesCol);
        return snapshot.docs.map(doc => fromFirestore<OrderStatus>(doc));
    },

    async createStatus(data: Omit<OrderStatus, 'id'>): Promise<void> {
        await addDoc(collection(db, 'statuses'), data);
    },
    
    async updateStatus(id: string, data: Partial<OrderStatus>): Promise<void> {
        await updateDoc(doc(db, 'statuses', id), data);
    },

    async deleteStatus(id: string): Promise<void> {
        await deleteDoc(doc(db, 'statuses', id));
    },

    // --- Shop Info ---
    async getShopInfo(): Promise<ShopInfo | null> {
        const infoDoc = await getDoc(doc(db, 'shop', 'info'));
        if(infoDoc.exists()) {
            return infoDoc.data() as ShopInfo;
        }
        // Return default info if it doesn't exist
        return {
            name: 'Yoyo Shop',
            address: '123 Yoyo Lane, String City, 98765',
            phone: '(123) 456-7890',
            invoiceFooter: 'Thank you for your business!',
        };
    },

    async updateShopInfo(data: ShopInfo): Promise<void> {
        await setDoc(doc(db, 'shop', 'info'), data);
    },

    // --- Reports ---
    async getLowStockProducts(): Promise<Product[]> {
        const q = query(collection(db, 'products'), where('stockQuantity', '<', 10));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => fromFirestore<Product>(doc));
    }
};

export default api;