import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@components/common/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
                secondary:
                    'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive:
                    'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
                outline: 'text-foreground',
                flat: 'border-transparent bg-opacity-20',
            },
            colorScheme: {
                default: '',
                primary: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
                secondary: 'bg-gray-500/20 text-gray-700 dark:text-gray-300',
                success: 'bg-green-500/20 text-green-700 dark:text-green-300',
            },
        },
        defaultVariants: {
            variant: 'default',
            colorScheme: 'default',
        },
    },
);

export interface BadgeProps
    extends
        React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, colorScheme, ...props }: BadgeProps) {
    return (
        <div
            data-slot="badge"
            className={cn(badgeVariants({ variant, colorScheme }), className)}
            {...props}
        />
    );
}

// Chip 作为 Badge 的别名，以兼容 heroui 的命名
const Chip = Badge;

export { Badge, Chip, badgeVariants };
