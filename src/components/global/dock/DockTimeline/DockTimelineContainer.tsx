import {css} from "@emotion/react"
import {Fragment} from "react";

import DockTimelineMain from "./DockTimelineMain.tsx";
import DockTimelineSub from "./DockTimelineSub.tsx";
import type {IndexHighlightPost} from "@apiClients/ghostPosts.ts";

export default function DockTimelineContainer(props: { posts: IndexHighlightPost[] }) {
    const posts = props.posts;
    console.log(posts);
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

function renderSubScale() {

}
