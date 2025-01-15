import type {FC as ReactFC, ReactElement} from "react";
import {Fragment} from "react";
import {Card, CardHeader, CardFooter, Image, Chip} from "@nextui-org/react";
import {css} from "@emotion/react";

import type {IndexHighlightPost, PostTag} from "@apiClients/ghostPosts.ts";

const IndexPost: ReactFC<IndexHighlightPost> = ({title, url, feature_image, published_at, primary_tag, tags}) => (
    <Card css={cardStyle} className="bg-transparent hover:scale-105 hover:-translate-y-3" isFooterBlurred isPressable onPress={() => window.open(url, "_blank")}>
        <CardHeader css={cardHeaderStyle} className="absolute flex-col items-start bg-neutral-200/85 dark:bg-gray-800/85">
            <span className="flex justify-between w-full">
                {renderPrimaryTag(primary_tag)}
                {renderTags(tags)}
            </span>
            <span css={cardHeaderTitleStyle} className='text-nowrap font-medium'>{renderTitle(title)}</span>
        </CardHeader>
        <Image
            removeWrapper
            alt="Post Cover"
            css={cardCoverStyle}
            className="object-cover"
            loading="eager"
            src={feature_image.toString()}
        />
        <CardFooter css={cardFooterStyle} className="absolute text-white font-normal bg-black/30">
            <p>{published_at.split("T")[0]}</p>
        </CardFooter>
    </Card>
)

function renderTitle(title: string): string {
    return title.length > 19 ? `${title.slice(0, 19)}...` : title;
}

function renderPrimaryTag(primary_tag?: PostTag): ReactElement {
    return (
        <Chip
            css={cardHeaderTagsStyle}
            variant="flat"
            color="primary"
            radius="sm"
        >
            {primary_tag?.name || "default"}
        </Chip>
    );
}

function renderTags(tags?: PostTag[]): ReactElement | null {
    if (!tags) return null

    return (
        <Fragment>
            {tags.map(tag =>
                          tag.slug.includes("series-") ? (
                              <Chip
                                  key={tag.slug}
                                  css={cardHeaderTagsStyle}
                                  variant="flat"
                                  color="secondary"
                                  radius="sm"
                              >
                                  {tag.name}
                              </Chip>
                          ) : null
            )}
        </Fragment>
    )
}

const cardStyle = css`
    min-width     : 300px;
    height        : 100%;
    border-radius : 20px;
`;

const cardHeaderStyle = css`
    z-index : 10;
`;

const cardHeaderTagsStyle = css`
    height        : 1.8em;
    font-size     : 0.665em;
    padding-left  : 0.3em;
    margin-bottom : 1.15em;
`;

const cardHeaderTitleStyle = css`
    font-size   : 1.125em;
    line-height : 1.1em;
`;

const cardCoverStyle = css`
    width           : 100%;
    height          : 100%;
    border-radius   : 22px;
    image-rendering : crisp-edges;
    padding         : 0;
    z-index         : 0;
`;

const cardFooterStyle = css`
    height       : 2.5em;
    padding-left : 1.2em;
    font-size    : 0.9em;
    color        : #B2B2B2;
    z-index      : 10;
    bottom       : 0;
`;

export default IndexPost;