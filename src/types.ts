export enum UserRole {
    ADMIN = 'admin',
    STAFF = 'staff',
    CUSTOMER = 'customer',
    ACCOUNTANT = 'accountant',
    SUPERVISOR = 'supervisor',
    MANAGER = 'manager',
    SALES = 'sales',
    PRODUCER = 'producer',
}

export interface User {
    id: string; // Firestore document ID (uid from Auth)
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    role: UserRole;
    createdAt: string; // ISO string
}

export interface Product {
    id: string; // Firestore document ID
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    createdAt: string; // ISO string
}

export interface OrderStatus {
    id: string; // Firestore document ID
    name: string;
    color: string;
}

export interface OrderItem {
    productId: string;
    quantity: number;
    price: number; // Price at the time of order
    product?: Product;
}

export interface Order {
    id: string; // Firestore document ID
    userId: string;
    user?: User;
    status: string;
    totalAmount: number;
    amountPaid: number;
    createdAt: string; // ISO string
    orderItems: OrderItem[];
    deleted?: boolean;
}

export interface SalesReportData {
    period: string;
    totalSales: number;
}

export interface ShopInfo {
    name: string;
    address: string;
    phone: string;
    invoiceFooter: string;
}