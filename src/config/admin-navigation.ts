import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Truck,
  User,
  Bell,
  MessageCircle,
  CreditCard,
  BarChart3,
  HelpCircle,
  FileText,
  Rocket,
  MousePointerClick,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '@prisma/client';

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  description: string;
}

/**
 * Central navigation configuration for admin panel
 * Single source of truth for all admin navigation items
 */
export const adminNavigation: NavigationItem[] = [
  // 🏠 Dashboard Section
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Overview & Alerts',
  },

  // 📦 Orders Section - Flat structure, contextual tabs handle sub-sections
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'All Orders, Shipping, Fulfillment, Analytics',
  },

  // 🛍️ Products Section - Flat structure, contextual tabs handle sub-sections
  {
    label: 'Products',
    href: '/admin/products',
    icon: Package,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Catalog, Categories, Inventory',
  },

  // 👥 Customers Section - Flat structure, contextual tabs handle sub-sections
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: Users,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Directory, Membership, Referrals',
  },

  // 👤 Agent Applications Section - Agent application management
  {
    label: 'Agent Applications',
    href: '/admin/agent-applications',
    icon: User,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Manage and review agent applications',
  },

  // 💳 Payments Section
  {
    label: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Gateways, Transactions, Refunds',
  },

  // 🚚 Shipping Section - Contextual tabs handle Configuration, Couriers, Tracking
  {
    label: 'Shipping',
    href: '/admin/shipping-settings',
    icon: Truck,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Configuration, Couriers, Tracking',
  },

  // 📊 Reports Section - Sales analytics and reporting
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
    description: 'Sales Analytics, Performance Reports',
  },

  // 🔔 Notifications Section
  {
    label: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
    description: 'System Notifications',
  },

  // 💬 Chat Configuration
  {
    label: 'Chat Config',
    href: '/admin/chat-config',
    icon: MessageCircle,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
    description: 'n8n Chat Widget Configuration',
  },

  // 📄 Articles Section
  {
    label: 'Articles',
    href: '/admin/content/articles',
    icon: FileText,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
    description: 'Manage Blog Articles & Content',
  },

  // 🚀 Landing Pages Section
  {
    label: 'Landing Pages',
    href: '/admin/landing-pages',
    icon: Rocket,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
    description: 'Manage Marketing Landing Pages',
  },

  // 🖱️ Click Pages Section
  {
    label: 'Click Pages',
    href: '/admin/click-pages',
    icon: MousePointerClick,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
    description: 'Manage Click-Through Landing Pages',
  },

  // ❓ FAQ Section
  {
    label: 'FAQs',
    href: '/admin/content/faqs',
    icon: HelpCircle,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
    description: 'Manage Frequently Asked Questions',
  },

  // ⚙️ Settings Section
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
    description: 'Business Profile, Tax Config, Site Customization',
  },
];
