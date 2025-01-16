import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import type { ReactNode } from "react";

type EmotionProviderProps = {
    children: ReactNode;
};

const cache = createCache({
                              key: 'emotion-css',
                              prepend: true ,
});

export default function EmotionCacheProvider({ children }: EmotionProviderProps) {
    return <CacheProvider value={cache}>{children}</CacheProvider>;
}