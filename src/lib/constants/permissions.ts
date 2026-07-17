export const PERMISSION_MODULES = [
  'dashboard',
  'users',
  'roles',
  'products',
  'inventory',
  'orders',
  'customers',
  'coupons',
  'banners',
  'categories',
  'brands',
  'reports',
  'settings'
] as const;

export type PermissionModule = typeof PERMISSION_MODULES[number];

export const PERMISSIONS = {
  dashboard: ['view'],
  users: ['view', 'create', 'edit', 'delete', 'assign_roles'],
  roles: ['view', 'create', 'edit', 'delete'],
  products: ['view', 'create', 'edit', 'delete'],
  inventory: ['view', 'manage', 'adjust_stock', 'view_history'],
  orders: ['view', 'edit', 'cancel', 'refund'],
  customers: ['view', 'edit', 'delete'],
  coupons: ['view', 'create', 'edit', 'delete'],
  banners: ['view', 'create', 'edit', 'delete'],
  categories: ['view', 'create', 'edit', 'delete'],
  brands: ['view', 'create', 'edit', 'delete'],
  reports: ['view', 'export'],
  settings: ['view', 'update']
} as const;

export type PermissionKey = 
  | `dashboard.${typeof PERMISSIONS['dashboard'][number]}`
  | `users.${typeof PERMISSIONS['users'][number]}`
  | `roles.${typeof PERMISSIONS['roles'][number]}`
  | `products.${typeof PERMISSIONS['products'][number]}`
  | `inventory.${typeof PERMISSIONS['inventory'][number]}`
  | `orders.${typeof PERMISSIONS['orders'][number]}`
  | `customers.${typeof PERMISSIONS['customers'][number]}`
  | `coupons.${typeof PERMISSIONS['coupons'][number]}`
  | `banners.${typeof PERMISSIONS['banners'][number]}`
  | `categories.${typeof PERMISSIONS['categories'][number]}`
  | `brands.${typeof PERMISSIONS['brands'][number]}`
  | `reports.${typeof PERMISSIONS['reports'][number]}`
  | `settings.${typeof PERMISSIONS['settings'][number]}`;

export const getAllPermissions = (): string[] => {
  const all: string[] = [];
  Object.entries(PERMISSIONS).forEach(([module, actions]) => {
    actions.forEach(action => {
      all.push(`${module}.${action}`);
    });
  });
  return all;
};
