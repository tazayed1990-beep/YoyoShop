import { db, auth } from './firebase';
import firebase from 'firebase/compat/app';
import { User, Product, Order, OrderStatus, ShopInfo } from '../types';

const { Timestamp } = firebase.firestore;

// --- Helper Functions ---

/**
 * Converts a Firestore document snapshot to a typed object,
 * including the document ID and converting timestamps to ISO strings.
 */
const fromFirestore = <T>(snapshot: firebase.firestore.DocumentSnapshot): T => {
    const data = snapshot.data()!;
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
        const usersCol = db.collection('users');
        const q = usersCol.orderBy('createdAt', 'desc');
        const snapshot = await q.get();
        return snapshot.docs.map(doc => fromFirestore<User>(doc));
    },

    async getUserProfile(uid: string): Promise<User | null> {
        const userDocRef = db.collection('users').doc(uid);
        const docSnap = await userDocRef.get();
        if (docSnap.exists) {
            return fromFirestore<User>(docSnap);
        }
        return null;
    },

    async createUser(userData: any): Promise<void> {
        const userCredential = await auth.createUserWithEmailAndPassword(userData.email, userData.password);
        const { uid } = userCredential.user!;
        const userDocRef = db.collection('users').doc(uid);
        await userDocRef.set({
            name: userData.name,
            email: userData.email,
            phone: userData.phone || '',
            address: userData.address || '',
            role: userData.role,
            createdAt: Timestamp.now(),
        });
    },

    async updateUser(id: string, data: Partial<User>): Promise<void> {
        const userDoc = db.collection('users').doc(id);
        await userDoc.update(data);
    },

    async deleteUser(id: string): Promise<void> {
        // Note: This only deletes the Firestore record, not the Firebase Auth user.
        // Deleting auth users requires the Admin SDK (backend).
        await db.collection('users').doc(id).delete();
    },

    // --- Products ---
    async getProducts(): Promise<Product[]> {
        const productsCol = db.collection('products');
        const q = productsCol.orderBy('createdAt', 'desc');
        const snapshot = await q.get();
        return snapshot.docs.map(doc => fromFirestore<Product>(doc));
    },

    async createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<void> {
        await db.collection('products').add({
            ...data,
            createdAt: Timestamp.now()
        });
    },

    async updateProduct(id: string, data: Partial<Product>): Promise<void> {
        await db.collection('products').doc(id).update(data);
    },

    async deleteProduct(id: string): Promise<void> {
        await db.collection('products').doc(id).delete();
    },
    
    // --- Orders ---
    async getOrders(): Promise<Order[]> {
        const ordersCol = db.collection('orders');
        const q = ordersCol.orderBy('createdAt', 'desc');
        const orderSnapshot = await q.get();
        
        const orders: Order[] = orderSnapshot.docs.map(doc => fromFirestore<Order>(doc));

        // In a large-scale app, denormalizing user/product names into orders is better.
        // For now, we fetch them to populate the data as the mock API did.
        const users = await this.getUsers();
        const products = await this.getProducts();
        const userMap = new Map(users.map(u => [u.id, u]));
        const productMap = new Map(products.map(p => [p.id, p]));

        // Populate user and product details
        for (const order of orders) {
            order.user = userMap.get(order.userId) ?? undefined;
            for (const item of order.orderItems) {
                item.product = productMap.get(item.productId) ?? undefined;
            }
        }

        return orders;
    },
    
    async getOrder(id: string): Promise<Order | null> {
         const orderDocRef = db.collection('orders').doc(id);
         const docSnap = await orderDocRef.get();

         if (!docSnap.exists) return null;

         const order = fromFirestore<Order>(docSnap);

         // Populate user and product data
         order.user = await this.getUserProfile(order.userId) ?? undefined;
         for (const item of order.orderItems) {
             const productDoc = await db.collection('products').doc(item.productId).get();
             if (productDoc.exists) {
                 item.product = fromFirestore<Product>(productDoc);
             }
         }
         return order;
    },

    async createOrder(data: any): Promise<void> {
         await db.collection('orders').add({
             ...data,
             deleted: false,
             createdAt: Timestamp.now()
         });
    },

    async updateOrder(id: string, data: Partial<Order>): Promise<void> {
        await db.collection('orders').doc(id).update(data);
    },

    async deleteOrder(id: string): Promise<void> {
        // Soft delete
        await db.collection('orders').doc(id).update({ deleted: true });
    },

    // --- Order Statuses ---
     async getStatuses(): Promise<OrderStatus[]> {
        const statusesCol = db.collection('statuses');
        const snapshot = await statusesCol.get();
        return snapshot.docs.map(doc => fromFirestore<OrderStatus>(doc));
    },

    async createStatus(data: Omit<OrderStatus, 'id'>): Promise<void> {
        await db.collection('statuses').add(data);
    },
    
    async updateStatus(id: string, data: Partial<OrderStatus>): Promise<void> {
        await db.collection('statuses').doc(id).update(data);
    },

    async deleteStatus(id: string): Promise<void> {
        await db.collection('statuses').doc(id).delete();
    },

    // --- Shop Info ---
    async getShopInfo(): Promise<ShopInfo | null> {
        const infoDoc = await db.collection('shop').doc('info').get();
        if(infoDoc.exists) {
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
        await db.collection('shop').doc('info').set(data);
    },

    // --- Reports ---
    async getLowStockProducts(): Promise<Product[]> {
        const q = db.collection('products').where('stockQuantity', '<', 10);
        const snapshot = await q.get();
        return snapshot.docs.map(doc => fromFirestore<Product>(doc));
    }
};

export default api;
