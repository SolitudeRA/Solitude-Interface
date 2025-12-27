import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@components/common/lib/utils';

function Switch({
    className,
    ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            className={cn(
                'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-[1.45em] w-11 shrink-0 items-center rounded-full border border-border shadow-sm transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className={cn(
                    'bg-background data-[state=checked]:bg-primary-foreground data-[state=unchecked]:bg-muted-foreground pointer-events-none block size-6.5 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:-translate-x-0.5',
                )}
            />
        </SwitchPrimitive.Root>
    );
}

export { Switch };
