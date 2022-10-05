import * as React from 'react';

type Props = {
    left: number,
    suggestedBlocks: Array<number>;
    scrollTo: (position: number) => void;
};

/*
* Example of BoundingBoxes used as text highlights
*/
export const AuthorSuggestionsNavigator: React.FunctionComponent<Props> = ({
    left,
    suggestedBlocks,
    scrollTo,
}: Props) => {

};
