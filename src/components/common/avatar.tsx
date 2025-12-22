import * as React from 'react';

import { cn } from '@components/common/lib/utils';

interface AvatarProps extends React.ComponentProps<'div'> {
    src?: string;
    alt?: string;
    showFallback?: boolean;
    fallback?: React.ReactNode;
}

function Avatar({
    className,
    src,
    alt = 'Avatar',
    showFallback = true,
    fallback,
    ...props
}: AvatarProps) {
    const [imageError, setImageError] = React.useState(false);

    return (
        <div
            data-slot="avatar"
            className={cn(
                'relative flex shrink-0 overflow-hidden rounded-full',
                className,
            )}
            {...props}
        >
            {src && !imageError ? (
                <img
                    src={src}
                    alt={alt}
                    className="aspect-square h-full w-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : showFallback ? (
                <div
                    data-slot="avatar-fallback"
                    className="bg-muted flex h-full w-full items-center justify-center rounded-full"
                >
                    {fallback || (
                        <span className="text-muted-foreground text-sm font-medium">
                            {alt?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                    )}
                </div>
            ) : null}
        </div>
    );
}

export { Avatar };
