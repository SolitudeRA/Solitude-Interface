import type React from "react";
import {css} from "@emotion/react";
import {Card, CardHeader, CardFooter, Image} from "@nextui-org/react";

import type {IndexHighlightPost} from "../../../apiClients/ghostPosts.ts";

const IndexPost: React.FC<IndexHighlightPost> = ({title, url, feature_image, published_at, primary_tag, tags}) => (
    <Card css={cardStyle} className="bg-transparent" isFooterBlurred isPressable onPress={() => window.open(url, "_blank")}>
        <CardHeader css={cardHeaderStyle} className="absolute flex-col items-start  bg-white/85 dark:bg-gray-800/85">
            <p className="px-1 mb-1 text-sm">{primary_tag?.name}</p>
            <h4 className='text-nowrap font-medium'>{title}</h4>
        </CardHeader>
        <Image
            removeWrapper
            alt="Post Cover"
            css={cardCoverStyle}
            className="object-cover"
            src={feature_image.toString()}
        />
        <CardFooter css={cardFooterStyle} className="absolute px-6 text-white text-sm font-light bg-black/35">
            <p>{published_at.split("T")[0]}</p>
        </CardFooter>
    </Card>
)

const cardStyle = css`
    height        : 100%;
    border-radius : 20px;
`;

const cardHeaderStyle = css`
    z-index : 10;
`;

const cardCoverStyle = css`
    border-radius : 22px;
    padding       : 0;
    z-index       : 0;
    width         : 100%;
    height        : 100%;
`;

const cardFooterStyle = css`
    z-index : 10;
    height  : 2.5em;
    bottom  : 0;
`;

export default IndexPost;