import type React from "react";
import {Card, CardHeader, CardFooter, Image} from "@nextui-org/react";

import type {IndexHighlightPost} from "../../../apiClients/ghostPosts.ts";

const IndexPost: React.FC<IndexHighlightPost> = ({title, url, feature_image, published_at}) => (
    <div>
        <Card className="h-full" isFooterBlurred isPressable onPress={() => window.open(url, "_blank")}>
            <CardHeader className="absolute z-10 top-1 flex-col items-start">
                <p>test</p>
                <h4>{title}</h4>
            </CardHeader>
            <Image
                removeWrapper
                alt="Post Cover"
                className="z-0 w-full h-full object-cover"
                src={feature_image.toString()}
            />
            <CardFooter className="absolute bg-white/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100">
                <p>{published_at}</p>
            </CardFooter>
        </Card>
    </div>
)

export default IndexPost;