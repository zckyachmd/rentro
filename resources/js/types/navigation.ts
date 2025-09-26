import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';

export type IconComponent =
    | LucideIcon
    | React.ComponentType<React.SVGProps<SVGSVGElement>>;

// Base public link shape used across header/footer navigation
export type PublicLink = {
    label: string;
    href?: string;
    icon?: string | IconComponent;
    target?: string;
    rel?: string;
};

export type MenuChild = {
    label: string;
    href?: string;
    name?: string;
    icon?: IconComponent;
};

export type MenuItem = {
    label: string;
    href?: string;
    name?: string;
    icon?: IconComponent;
    children?: MenuChild[];
};

export type MenuGroup = { id: string; label: string; items: MenuItem[] };

export type PublicMenuItem = {
    label: string;
    href?: string;
    icon?: string;
    target?: string;
    rel?: string;
    children?: PublicMenuItem[];
};

// Footer sections (roots) and items (children)
export type PublicFooterItem = PublicLink;
export type PublicFooterSection = {
    label: string;
    children?: PublicFooterItem[];
};

// Inertia shared props we use in the public layout
export type SharedPublicMenusProps = {
    publicMenus?: PublicMenuItem[];
    publicFooterMenus?: PublicFooterSection[];
};
