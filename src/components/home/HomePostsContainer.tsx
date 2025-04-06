import {css} from "@emotion/react"
import IndexPost from "@components/index/IndexPost.tsx";
import type {IndexHighlightPost} from "api/ghost/posts";
import React, {useRef} from "react";

export default function IndexPostsContainer(props: { posts: IndexHighlightPost[] }) {
    const posts = props.posts;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        if (scrollContainerRef.current) {
            event.deltaY > 0 ?
                scrollContainerRef.current.scrollBy({
                                                        left: 50,
                                                        behavior: "smooth"
                                                    })
                : scrollContainerRef.current.scrollBy({
                                                          left: -50,
                                                          behavior: "smooth"
                                                      });
        }
    }

    return (
        <div css={containerStyle} className="col-span-8">
            <div
                ref={scrollContainerRef}
                css={containerAdjustStyle}
                className="snap-x solitude-index-post-scroll"
                onWheel={handleWheel}
            >
                {posts.map((post: IndexHighlightPost) => (
                    <IndexPost key={post.id} post={post}/>
                ))}
            </div>
        </div>
    );
}

const containerStyle = css`
    height : 18.5rem;
`;

const containerAdjustStyle = css`
    overflow-x         : scroll;
    overflow-y         : hidden;
    white-space        : nowrap;
    height             : 100%;
    width              : 88%;
    padding-top        : 3.2rem;
    padding-right      : 10rem;
    scroll-snap-type   : x mandatory;
    scrollbar-width    : none;
    -ms-overflow-style : none;

    &::-webkit-scrollbar {
        display : none;
    }
`;