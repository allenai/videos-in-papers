import {
  BoundingBox,
  BoundingBoxType,
  DocumentContext,
  HighlightOverlay,
  scaleRawBoundingBox,
  UiContext,
} from '@allenai/pdf-components';
import * as React from 'react';

import { Caption, Clip, Highlight, Token } from '../types/clips';

type Props = {
  pageIndex: number;
  hoveredWord: { clipId: number; syncIdx: number } | null;
  syncSegments: { [clipId: number]: { paperToIdx: { [id: string]: number }; captionToIdx: { [id: string]: number } } };
  tokens: Token[];
};

const colors = ['#cb725e', '#d9a460', '#3e9d29', '#306ed3', '#07cead', '#9d58e1', '#dd59ba'];

/*
 * Overlaying sidebars on the margin of the paper
 */
export const WordOverlay: React.FunctionComponent<Props> = ({
  pageIndex,
  hoveredWord,
  syncSegments,
  tokens,
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);

  function processText(text: string) {
    return text.toLowerCase().replace(/[^A-Za-z0-9\s]/g, '');
  }

  function getTokens() {
    if (hoveredWord == null) {
      return [];
    }

    return tokens.filter(token => {
      return token.page == pageIndex && token.syncIdx == hoveredWord.syncIdx;
    });
  }

  function renderHighlightedBoundingBoxes(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    getTokens().map((token: Token, i: number) => {
      const bbox = scaleRawBoundingBox(token, pageDimensions.height, pageDimensions.width);

      // Only render this BoundingBox if it belongs on the current page
      const props = {
        ...bbox,
        id: pageIndex + '-' + token.id,
        className: 'reader_highlight_color-mapped-' + (hoveredWord ? hoveredWord.clipId % 7 : 0),
        // Set isHighlighted to true for highlighted styling
        isHighlighted: true,
        key: pageIndex + '-' + token.id,
      };

      boxes.push(<BoundingBox {...props} />);
    });
    return boxes;
  }

  return <React.Fragment>{renderHighlightedBoundingBoxes()}</React.Fragment>;
};
