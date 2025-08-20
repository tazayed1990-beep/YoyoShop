
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
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    role: UserRole;
    createdAt: string;
    password?: string;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    createdAt: string;
}

export interface OrderStatus {
    id: number;
    name: string;
    color: string;
}

export interface OrderItem {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    price: number;
    product?: Product;
}

export interface Order {
    id: number;
    userId: number;
    user?: User;
    status: string;
    totalAmount: number;
    amountPaid: number;
    createdAt: string;
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
