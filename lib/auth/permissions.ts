import { Role } from "@prisma/client";

/**
 * Granüler yetki matrisi.
 *
 * MVP kapsamında admin paneline erişim kontrolü, route bazında bu
 * permission'lar üzerinden yapılır. Mevcut "ADMIN" eski kayıtlarda
 * SUPER_ADMIN ile aynı yetkiye sahiptir (geriye dönük uyumluluk).
 */
export type Permission =
  | "products.read"
  | "products.write"
  | "orders.read"
  | "orders.write"
  | "production.advance"
  | "shipments.write"
  | "customers.read"
  | "customers.write"
  | "invoices.write"
  | "delivery.notes.write"
  | "accounting.read"
  | "accounting.export"
  | "audit.read"
  | "users.manage"
  | "warehouses.manage"
  | "conversations.read";

const ALL: Permission[] = [
  "products.read", "products.write",
  "orders.read", "orders.write",
  "production.advance", "shipments.write",
  "customers.read", "customers.write",
  "invoices.write", "delivery.notes.write",
  "accounting.read", "accounting.export",
  "audit.read", "users.manage", "warehouses.manage",
  "conversations.read",
];

const ROLE_PERMS: Record<Role, Permission[]> = {
  ADMIN: ALL,
  SUPER_ADMIN: ALL,
  OPERATIONS: [
    "products.read",
    "orders.read", "orders.write",
    "production.advance", "shipments.write",
    "customers.read",
    "delivery.notes.write",
    "conversations.read",
  ],
  ACCOUNTING: [
    "orders.read",
    "customers.read",
    "invoices.write",
    "accounting.read", "accounting.export",
    "audit.read",
  ],
  WAREHOUSE: [
    "products.read", "products.write",
    "orders.read",
    "production.advance",
    "warehouses.manage",
  ],
  SALES: [
    "products.read",
    "customers.read", "customers.write",
    "orders.read",
    "conversations.read",
  ],
  CUSTOMER: [],
};

export function hasPermission(role: Role | undefined | null, perm: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMS[role]?.includes(perm) ?? false;
}

export function isAdminRole(role: Role | undefined | null): boolean {
  if (!role) return false;
  return role !== "CUSTOMER";
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Yönetici (Eski)",
  SUPER_ADMIN: "Süper Yönetici",
  OPERATIONS: "Operasyon",
  ACCOUNTING: "Muhasebe",
  WAREHOUSE: "Depo",
  SALES: "Satış",
  CUSTOMER: "Müşteri",
};
