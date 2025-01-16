import {css} from "@emotion/react"
import type {IndexHighlightPost} from "@apiClients/ghostPosts.ts";

export default function NavbarTimeline(props: { posts: IndexHighlightPost[] }) {
    const posts = props.posts;

    return (
        <div css={[navbarTimeLineMain, navbarTimeLineSub]}>

        </div>
    );
}

const navbarTimeLineMain = css`
`;

const navbarTimeLineSub = css`
`;