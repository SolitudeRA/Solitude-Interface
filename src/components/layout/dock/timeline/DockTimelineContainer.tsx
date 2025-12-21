import { css } from "@emotion/react";

import type { FeaturedPost } from "@api/ghost/types";

export default function DockTimelineContainer(props: { posts: FeaturedPost[] }) {
    // TODO: 在此处使用 props.posts 渲染时间线内容
    console.log('Timeline posts:', props.posts.length);
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
