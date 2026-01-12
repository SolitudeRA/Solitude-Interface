import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@components/common/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-lg border px-3 py-1 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
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
                flat: 'backdrop-blur-md shadow-sm',
            },
            colorScheme: {
                default: '',
                primary:
                    'bg-blue-500/30 text-blue-50 border-blue-300/40 dark:bg-blue-500/25 dark:text-blue-100 dark:border-blue-400/30',
                secondary:
                    'bg-gray-500/30 text-gray-50 border-gray-300/40 dark:bg-gray-500/25 dark:text-gray-100 dark:border-gray-400/30',
                success:
                    'bg-green-500/30 text-green-50 border-green-300/40 dark:bg-green-500/25 dark:text-green-100 dark:border-green-400/30',
                warning:
                    'bg-amber-500/30 text-amber-50 border-amber-300/40 dark:bg-amber-500/25 dark:text-amber-100 dark:border-amber-400/30',
                info: 'bg-cyan-500/30 text-cyan-50 border-cyan-300/40 dark:bg-cyan-500/25 dark:text-cyan-100 dark:border-cyan-400/30',
                purple: 'bg-purple-500/30 text-purple-50 border-purple-300/40 dark:bg-purple-500/25 dark:text-purple-100 dark:border-purple-400/30',
                rose: 'bg-rose-500/30 text-rose-50 border-rose-300/40 dark:bg-rose-500/25 dark:text-rose-100 dark:border-rose-400/30',
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
