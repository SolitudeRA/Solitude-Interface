import {Fragment} from "react";
import type {ReactElement} from "react";
import {motion} from "motion/react";
import {css} from "@emotion/react";
import {Card, CardHeader, CardFooter, Image, Chip} from "@heroui/react";

import type {IndexHighlightPost, PostTag} from "@apiClients/ghostPosts.ts";

export default function IndexPost(props: { post: IndexHighlightPost }) {
    const post = props.post;

    return (
        <motion.div
            css={cardStyle}
            className="snap-start scroll-ml-[40px] bg-transparent"
            initial={{opacity: 0}}
            whileInView={{opacity: 1}}
        >
            <Card className="w-full h-full" isFooterBlurred isPressable onPress={() => window.open(post.url, "_blank")}>
                <CardHeader css={cardHeaderStyle} className="absolute flex-col items-start bg-neutral-200/85 dark:bg-gray-800/85">
                    <span className="flex justify-between w-full">
                        {renderPrimaryTag(post.primary_tag)}
                        {renderTags(post.tags)}
                    </span>
                    <span css={cardHeaderTitleStyle} className='text-nowrap font-medium'>{renderTitle(post.title)}</span>
                </CardHeader>
                <Image
                    removeWrapper
                    alt="Post Cover"
                    css={cardCoverStyle}
                    className="object-cover"
                    loading="eager"
                    src={post.feature_image.toString()}
                />
                <CardFooter css={cardFooterStyle} className="absolute text-white font-normal bg-black/30">
                    <p>{post.published_at.split("T")[0]}</p>
                </CardFooter>
            </Card>
        </motion.div>
    );
}

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
    display       : inline-block;
    width         : 19.8rem;
    min-width     : 300px;
    aspect-ratio  : 7 / 5;
    border-radius : 20px;
    margin-left   : 50px;
`;

const cardHeaderStyle = css`
    z-index : 10;
`;

const cardHeaderTagsStyle = css`
    height        : 1.35rem;
    font-size     : 0.665rem;
    padding-left  : 0.3rem;
    margin-bottom : 0.82rem;
`;

const cardHeaderTitleStyle = css`
    font-size     : 1.125rem;
    line-height   : 1.1rem;
    margin-bottom : 0.1rem;
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
    height       : 2.5rem;
    padding-left : 1.2rem;
    font-size    : 0.9rem;
    color        : #B2B2B2;
    z-index      : 10;
    bottom       : 0;
`;