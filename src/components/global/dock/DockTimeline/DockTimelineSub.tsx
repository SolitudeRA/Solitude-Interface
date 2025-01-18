import {css} from "@emotion/react"

export default function DockTimelineSub() {
    return (
        <div css={dockTimelineSubStyle}></div>
    );
}

const dockTimelineSubStyle = css`
    width            : 4px;
    height           : 2.3rem;
    background-color : #ebebeb;
    border-radius    : 2px;
    opacity          : 0.85;
    margin-left      : 0.5rem;
    margin-right     : 0.5rem;
`;