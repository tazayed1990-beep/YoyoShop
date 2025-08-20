
import { User, Product, Order, UserRole, OrderItem, OrderStatus, ShopInfo } from '../types';

// --- Start of Mock Data ---
// In-memory database for the mock API
let users: User[] = [
  { id: 1, name: 'Admin User', email: 'admin@example.com', role: UserRole.ADMIN, createdAt: new Date().toISOString(), password: '8520' },
  { id: 2, name: 'Staff User', email: 'staff@example.com', role: UserRole.STAFF, createdAt: new Date().toISOString(), password: 'password' },
  { id: 3, name: 'Customer One', email: 'customer1@example.com', role: UserRole.CUSTOMER, createdAt: new Date().toISOString(), password: 'password', address: '123 Main St, Anytown, USA', phone: '555-1234' },
  { id: 4, name: 'Customer Two', email: 'customer2@example.com', role: UserRole.CUSTOMER, createdAt: new Date('2023-05-10T09:00:00Z').toISOString(), password: 'password', address: '456 Oak Ave, Sometown, USA', phone: '555-5678' },
];

let products: Product[] = [
  { id: 1, name: 'Laptop Pro', description: 'High-end laptop for professionals', price: 1499.99, stockQuantity: 25, createdAt: new Date().toISOString() },
  { id: 2, name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 49.99, stockQuantity: 150, createdAt: new Date().toISOString() },
  { id: 3, name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard', price: 129.99, stockQuantity: 75, createdAt: new Date().toISOString() },
  { id: 4, name: '4K Monitor', description: '27-inch 4K UHD monitor', price: 399.99, stockQuantity: 40, createdAt: new Date().toISOString() },
  { id: 5, name: 'Webcam HD', description: '1080p HD webcam with microphone', price: 89.99, stockQuantity: 8, createdAt: new Date().toISOString() },
];

let orderStatuses: OrderStatus[] = [
    { id: 1, name: 'Started', color: 'blue' },
    { id: 2, name: 'First Layer Completed', color: 'indigo' },
    { id: 3, name: 'Final Layer Applied', color: 'purple' },
    { id: 4, name: 'Ready to Ship', color: 'yellow' },
    { id: 5, name: 'Completed', color: 'green' },
    { id: 6, name: 'Cancelled', color: 'red' },
];

// Define a type for the mock orders stored in memory, which don't have nested user/product objects.
type MockOrder = Omit<Order, 'user' | 'orderItems'> & {
  orderItems: Omit<OrderItem, 'product'>[];
};

let orders: MockOrder[] = [
  {
    id: 1,
    userId: 3,
    status: 'Completed',
    totalAmount: 1549.98,
    amountPaid: 1549.98,
    createdAt: new Date('2023-10-01T10:00:00Z').toISOString(),
    orderItems: [
      { id: 1, orderId: 1, productId: 1, quantity: 1, price: 1499.99 },
      { id: 2, orderId: 1, productId: 2, quantity: 1, price: 49.99 },
    ],
    deleted: false,
  },
  {
    id: 2,
    userId: 4,
    status: 'Final Layer Applied',
    totalAmount: 529.98,
    amountPaid: 200.00,
    createdAt: new Date('2023-10-25T14:30:00Z').toISOString(),
    orderItems: [
      { id: 3, orderId: 2, productId: 4, quantity: 1, price: 399.99 },
      { id: 4, orderId: 2, productId: 3, quantity: 1, price: 129.99 },
    ],
    deleted: false,
  },
  {
    id: 3,
    userId: 3,
    status: 'Started',
    totalAmount: 89.99,
    amountPaid: 0,
    createdAt: new Date().toISOString(),
    orderItems: [
      { id: 5, orderId: 3, productId: 5, quantity: 1, price: 89.99 },
    ],
    deleted: false,
  },
];

let shopInfo: ShopInfo = {
    name: 'Yoyo Shop',
    address: '123 Yoyo Lane, String City, 98765',
    phone: '(123) 456-7890',
    invoiceFooter: 'Thank you for your business!',
};

let nextUserId = users.length + 1;
let nextProductId = products.length + 1;
let nextOrderId = orders.length + 1;
let nextOrderItemId = orders.flatMap(o => o.orderItems).length + 1;
let nextStatusId = orderStatuses.length + 1;
// --- End of Mock Data ---


const SIMULATED_DELAY = 300; // ms

interface ApiResponse<T> {
  data: T;
}

const mockApi = {
  // A helper to simulate network delay
  request: <T>(data: T): Promise<ApiResponse<T>> => new Promise(resolve => setTimeout(() => resolve({ data }), SIMULATED_DELAY)),

  post: async <T>(url: string, payload: any): Promise<ApiResponse<T>> => {
    if (url.endsWith('/auth/login')) {
      const { email, password } = payload;
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        const tokenPayload = { id: user.id, name: user.name, email: user.email, role: user.role };
        const token = `fake-header.${btoa(JSON.stringify(tokenPayload))}.fake-signature`;
        return Promise.resolve({ data: { token } } as any);
      } else {
        await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
        return Promise.reject({ response: { status: 401, data: 'Invalid credentials' } });
      }
    }

    if (url.endsWith('/users')) {
        const newUser: User = { ...payload, id: nextUserId++, createdAt: new Date().toISOString() };
        users.push(newUser);
        return mockApi.request(newUser) as any;
    }
    
    if (url.endsWith('/products')) {
        const newProduct: Product = { ...payload, id: nextProductId++, createdAt: new Date().toISOString() };
        products.push(newProduct);
        return mockApi.request(newProduct) as any;
    }

    if (url.endsWith('/orders')) {
        const { userId, status, items, amountPaid } = payload;
        if (!userId || !status || !items || !Array.isArray(items)) {
            return Promise.reject(new Error('Invalid order payload'));
        }
        const newOrderId = nextOrderId++;
        let totalAmount = 0;
        
        const orderItems = items.map((item: {productId: number; quantity: number}) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) throw new Error(`Product with id ${item.productId} not found`);
            totalAmount += product.price * item.quantity;
            return {
                id: nextOrderItemId++,
                orderId: newOrderId,
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
            };
        });

        const newOrder: MockOrder = {
            id: newOrderId,
            userId,
            status,
            totalAmount,
            amountPaid: amountPaid || 0,
            createdAt: new Date().toISOString(),
            orderItems,
            deleted: false,
        };
        orders.push(newOrder);
        return mockApi.request(newOrder) as any;
    }
    
    if (url.endsWith('/statuses')) {
        const newStatus: OrderStatus = { ...payload, id: nextStatusId++ };
        orderStatuses.push(newStatus);
        return mockApi.request(newStatus) as any;
    }

    return Promise.reject(new Error(`POST to ${url} not mocked`));
  },

  get: async <T>(url: string): Promise<ApiResponse<T>> => {
    if (url.endsWith('/users')) return mockApi.request(users) as any;
    if (url.endsWith('/products')) return mockApi.request(products) as any;
    if (url.endsWith('/statuses')) return mockApi.request(orderStatuses) as any;
    if (url.endsWith('/shop-info')) return mockApi.request(shopInfo) as any;

    const orderIdMatch = url.match(/\/orders\/(\d+)/);
    if (orderIdMatch) {
        const id = parseInt(orderIdMatch[1], 10);
        const order = orders.find(o => o.id === id);
        if (order) {
            const populatedOrder: Order = {
                ...order,
                user: users.find(u => u.id === order.userId),
                orderItems: order.orderItems.map(item => ({
                    ...item,
                    product: products.find(p => p.id === item.productId)
                }))
            };
            return mockApi.request(populatedOrder) as any;
        } else {
            return Promise.reject({ response: { status: 404, data: 'Order not found' } });
        }
    }

    if (url.endsWith('/orders')) {
        const populatedOrders: Order[] = orders.map(order => ({
            ...order,
            user: users.find(u => u.id === order.userId),
            orderItems: order.orderItems.map(item => ({
                ...item,
                product: products.find(p => p.id === item.productId)
            }))
        })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return mockApi.request(populatedOrders) as any;
    }
    
    if (url.startsWith('/reports/sales')) {
        const params = new URLSearchParams(url.split('?')[1] || '');
        const period = params.get('period');
        let salesData = [];
        if (period === 'monthly') {
            salesData = [ { period: 'Jan', totalSales: 4500 }, { period: 'Feb', totalSales: 5200 }, { period: 'Mar', totalSales: 6100 }, { period: 'Apr', totalSales: 5800 }, { period: 'May', totalSales: 7300 }, { period: 'Jun', totalSales: 8000 }, ];
        } else if (period === 'daily') {
             salesData = Array.from({length: 7}, (_, i) => ({ period: `Day ${i+1}`, totalSales: Math.floor(Math.random() * (500 - 100 + 1) + 100) }));
        } else { // yearly
             salesData = [ { period: '2021', totalSales: 65000 }, { period: '2022', totalSales: 78000 }, { period: '2023', totalSales: 92000 }, ];
        }
        return mockApi.request(salesData) as any;
    }
    if (url.endsWith('/reports/low-stock')) {
        const lowStockProducts = products.filter(p => p.stockQuantity < 10);
        return mockApi.request(lowStockProducts) as any;
    }

    return Promise.reject(new Error(`GET to ${url} not mocked`));
  },

  put: async <T>(url: string, payload: any): Promise<ApiResponse<T>> => {
    const parts = url.split('/');
    const id = parseInt(parts[parts.length - 1]);
    
    if (url.includes('/users/')) {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex > -1) {
            const updatedUser = { ...users[userIndex], ...payload };
            if (!payload.password || payload.password === '') {
                updatedUser.password = users[userIndex].password;
            }
            users[userIndex] = updatedUser;
            return mockApi.request(updatedUser) as any;
        }
    }
    if (url.includes('/products/')) {
        const productIndex = products.findIndex(p => p.id === id);
        if (productIndex > -1) {
            products[productIndex] = { ...products[productIndex], ...payload, id };
            return mockApi.request(products[productIndex]) as any;
        }
    }
    if (url.includes('/orders/')) {
        const orderIndex = orders.findIndex(o => o.id === id);
        if (orderIndex > -1) {
            orders[orderIndex] = { ...orders[orderIndex], ...payload, id };
            return mockApi.request(orders[orderIndex]) as any;
        }
    }
    if (url.includes('/statuses/')) {
        const statusIndex = orderStatuses.findIndex(s => s.id === id);
        if (statusIndex > -1) {
            orderStatuses[statusIndex] = { ...orderStatuses[statusIndex], ...payload, id };
            return mockApi.request(orderStatuses[statusIndex]) as any;
        }
    }
    if (url.endsWith('/shop-info')) {
        shopInfo = { ...shopInfo, ...payload };
        return mockApi.request(shopInfo) as any;
    }

    return Promise.reject(new Error(`PUT to ${url} not mocked`));
  },

  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    const parts = url.split('/');
    const id = parseInt(parts[parts.length - 1]);

    if (url.includes('/users/')) {
        users = users.filter(u => u.id !== id);
        return mockApi.request({ message: 'User deleted' }) as any;
    }
    if (url.includes('/products/')) {
        products = products.filter(p => p.id !== id);
        return mockApi.request({ message: 'Product deleted' }) as any;
    }
     if (url.includes('/orders/')) {
        const orderIndex = orders.findIndex(o => o.id === id);
        if (orderIndex > -1) {
            orders[orderIndex].deleted = true;
            return mockApi.request({ message: 'Order marked as deleted' }) as any;
        }
    }
    if (url.includes('/statuses/')) {
        orderStatuses = orderStatuses.filter(s => s.id !== id);
        return mockApi.request({ message: 'Status deleted' }) as any;
    }

    return Promise.reject(new Error(`DELETE to ${url} not mocked`));
  },
};

export default mockApi;
