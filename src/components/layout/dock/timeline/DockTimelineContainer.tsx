import {css} from "@emotion/react"

import type {IndexHighlightPost} from "api/ghost/posts";

export default function DockTimelineContainer(props: { posts: IndexHighlightPost[] }) {
    const posts = props.posts;
    return (
        <div css={dockTimelineContainerStyle} className="flex items-center">

        </div>
    );
}

const dockTimelineContainerStyle = css`
    width      : 90%;
    height     : 3.5rem;
    min-height : 50px;
`;

