import { Fragment, useCallback } from 'react';
import type { ReactElement } from 'react';
import { css } from '@emotion/react';

import type { HighlightPost, PostTag } from '@api/ghost/types';

export default function IndexPost(props: { post: HighlightPost }) {
    const post = props.post;
    const handleCardClick = useCallback(() => {
        window.open(post.url, '_blank');
    }, [post.url]);

    return (
        <div
            css={cardStyle}
            className="snap-start scroll-ml-[40px] bg-transparent"
        >
            <div 
                className="w-full h-full relative" 
                css={cardContainerStyle}
                onClick={handleCardClick}
            >
                {/* Card Header */}
                <div
                    css={cardHeaderStyle}
                    className="absolute flex-col items-start bg-neutral-200/85 dark:bg-gray-800/85"
                >
                    <span className="flex justify-between w-full">
                        {renderPrimaryTag(post.primary_tag)}
                        {renderTags(post.tags)}
                    </span>
                    <span
                        css={cardHeaderTitleStyle}
                        className="text-nowrap font-medium"
                    >
                        {renderTitle(post.title)}
                    </span>
                </div>
                
                {/* Card Image */}
                <img
                    alt="Post Cover"
                    css={cardCoverStyle}
                    className="object-cover"
                    loading="eager"
                    src={post.feature_image.toString()}
                />
                
                {/* Card Footer */}
                <div
                    css={cardFooterStyle}
                    className="absolute text-white font-normal bg-black/30"
                >
                    <p>{post.published_at.split('T')[0]}</p>
                </div>
            </div>
        </div>
    );
}

function renderTitle(title: string): string {
    return title.length > 19 ? `${title.slice(0, 19)}...` : title;
}

function renderPrimaryTag(primary_tag?: PostTag): ReactElement {
    return (
        <span
            css={cardHeaderTagsStyle}
            className="inline-flex items-center bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100 rounded-sm"
        >
            {primary_tag?.name || 'default'}
        </span>
    );
}

function renderTags(tags?: PostTag[]): ReactElement | null {
    if (!tags) return null;

    return (
        <Fragment>
            {tags.map((tag) =>
                tag.slug.includes('series-') ? (
                    <span
                        key={tag.slug}
                        css={cardHeaderTagsStyle}
                        className="inline-flex items-center bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100 rounded-sm"
                    >
                        {tag.name}
                    </span>
                ) : null,
            )}
        </Fragment>
    );
}

const cardStyle = css`
    display       : inline-block;
    width         : 19.8rem;
    min-width     : 300px;
    aspect-ratio  : 7 / 5;
    border-radius : 20px;
    margin-left   : 50px;
    overflow      : hidden;
`;

const cardContainerStyle = css`
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease;
    
    &:hover {
        transform: scale(1.02);
    }
`;

const cardHeaderStyle = css`
    z-index: 10;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    padding: 1rem;
`;

const cardHeaderTagsStyle = css`
    height: 1.35rem;
    font-size: 0.665rem;
    padding: 0 0.5rem;
    margin-right: 0.5rem;
    margin-bottom: 0.82rem;
`;

const cardHeaderTitleStyle = css`
    font-size: 1.125rem;
    line-height: 1.1rem;
    margin-bottom: 0.1rem;
    color   : var(--text-plain-primary);
`;

const cardCoverStyle = css`
    width: 100%;
    height: 100%;
    border-radius: 0;
    image-rendering: crisp-edges;
    padding: 0;
    z-index: 0;
`;

const cardFooterStyle = css`
    height: 2.5rem;
    padding-left: 1.2rem;
    font-size: 0.9rem;
    z-index: 10;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    color: var(--text-plain-secondary);
`;
