import type {PostTag} from "api/ghost/posts";
import {Chip} from "@heroui/react";
import {Fragment, type ReactElement} from "react";

export default function PostMeta(props: {
    title: string;
    primary_tag?: PostTag | undefined;
    tags?: PostTag[] | undefined;
    published_at: string;
}) {
    return (
        <Fragment>
            <div className="flex justify-between solitude-article-meta-primary-tags">
                <div>
                    <Chip
                        color="primary"
                        variant="shadow"
                        size="lg"
                        radius="md"
                    >
                        {props.primary_tag ? props.primary_tag.name : "default"}
                    </Chip>
                </div>
                <div className="space-x-2.5">
                    {renderSeriesTags(props.tags)}
                </div>
            </div>
            <div className="h-[300px] w-full flex items-center">
                <h1 className="solitude-article-title w-full">{props.title}</h1>
            </div>
            <div className="flex justify-between items-end solitude-article-meta-other-tags">
                <div className="space-x-3">{renderOtherTags(props.tags)}</div>
                <div>
                    <Chip
                        color="default"
                        variant="shadow"
                        size="lg"
                        radius="md"
                    >
                        {props.published_at.split("T")[0]}
                    </Chip>
                </div>
            </div>
        </Fragment>
    );
}

function renderSeriesTags(tags?: PostTag[]): ReactElement | null {
    if (!tags) return null;
    return (
        <Fragment>
            {tags.map(tag =>
                          tag.slug.startsWith("series-") ? (
                              <Chip
                                  key={tag.slug}
                                  variant="shadow"
                                  color="secondary"
                                  size="lg"
                                  radius="md"
                              >
                                  {tag.name}
                              </Chip>
                          ) : null
            )}
        </Fragment>
    )
}

function renderOtherTags(tags?: PostTag[]): ReactElement | null {
    if (!tags) return null;
    return (
        <Fragment>
            {tags.filter((tag) => {
                return !tag.slug.startsWith("series-") && !tag.slug.startsWith("category-");
            }).map(
                tag =>
                    <Chip
                        key={tag.slug}
                        variant="shadow"
                        color="success"
                        size="lg"
                        radius="md"
                    >
                        {tag.name}
                    </Chip>
            )}
        </Fragment>
    );
}