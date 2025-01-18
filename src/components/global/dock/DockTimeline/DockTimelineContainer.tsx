import {css} from "@emotion/react"

import DockTimelineMain from "./DockTimelineMain.tsx";
import DockTimelineSub from "./DockTimelineSub.tsx";
import type {IndexHighlightPost} from "@apiClients/ghostPosts.ts";

export default function DockTimelineContainer(props: { posts: IndexHighlightPost[] }) {
    const posts = props.posts;

    return (
        <div css={dockTimelineContainerStyle} className="flex items-center">
            <DockTimelineMain/>
            <DockTimelineSub/>
        </div>
    );
}

const dockTimelineContainerStyle = css`
    width      : 90%;
    height     : 3.5rem;
    min-height : 50px;
`;
