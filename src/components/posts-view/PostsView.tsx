import PostCardDefault from "@components/posts-view/PostCardDefault.tsx";
import {css} from "@emotion/react"
import type {Post, PostTag} from "@apiClients/ghostPosts.ts";

export default function PostsView(props: { posts: Post[] }) {
    return (
        <div css={mainContainerStyle}>

        </div>
    );
}

const mainContainerStyle = css`
    width  : 100%;
    height : 100%;
`;

function getPostCardByType(post: Post) {
    const type = post.tags?.filter((tag: PostTag) => {
        return tag.name.startsWith("type-");
    });
}