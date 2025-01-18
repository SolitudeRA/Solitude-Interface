import {css} from "@emotion/react"

export default function DockTimelineMain() {
    return (
        <div css={dockTimelineMainContainerStyle}>
            <div className="flex justify-center">
                <div css={dockTimelineMainScaleStyle}></div>
            </div>
            <div css={dockTimelineMainTextStyle} className="text-center">

            </div>
        </div>
    );
}

const dockTimelineMainContainerStyle = css`
    width : 20px;
`;

const dockTimelineMainScaleStyle = css`
    width            : 4px;
    height           : 3rem;
    background-color : #EBEBEB;
    border-radius    : 2px;
    opacity          : 0.85;
    margin-left      : 0.5rem;
    margin-right     : 0.5rem;
`;

const dockTimelineMainTextStyle = css`
    width : 20px;
`;