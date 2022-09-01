import { BoundingBox, BoundingBoxType, HighlightOverlay, DocumentContext, UiContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Highlight, Clip, Token, Caption } from '../types/clips';
import * as React from 'react';

type Props = {
  pageIndex: number;
  clips: {[index: number]: Clip};
  highlights: {[index: number]: Highlight};
  playedHistory: {[index: number]: Array<number>};
};

const colors = [
  "#cb725e", "#d9a460", "#3e9d29", "#306ed3", "#07cead", "#9d58e1", "#dd59ba"
]

const stopwords = ['i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','can','will','just','don','should','now']

/*
 * Overlaying sidebars on the margin of the paper
 */
export const WordOverlay: React.FunctionComponent<Props> = ({ 
    pageIndex, 
    clips,
    highlights,
    playedHistory,
}: Props) => {
  const { isShowingTextHighlight } = React.useContext(UiContext);
  const { pageDimensions } = React.useContext(DocumentContext);

  if (!isShowingTextHighlight) {
    return null;
  }

  function getTokens() {
    var pageHighlights = Object.keys(highlights).filter((key: string) => {
      var pageRects = highlights[parseInt(key)].rects.filter((rect: BoundingBoxType) => rect.page == pageIndex);
      return pageRects.length > 0;
    });

    var allTokens: Array<Token> = pageHighlights.map((key) => {
      var highlight: Highlight = highlights[parseInt(key)];
      var clipId = parseInt(highlight.clip);
      var clip = clips[clipId];
      if(clip.highlights[clip.position] != parseInt(key)) {
        return [];
      }
      var clipText = clip.captions.map((caption, i) => {
        return playedHistory[clipId].includes(i) ? caption.caption.toLowerCase().replace(/[^A-Za-z0-9\s]/g, "") : "";
      }).reduce((prev: string, curr: string) => {
        return prev + " " + curr;
      });
      var clipWords = clipText.split(" ");
      
      return highlight['tokens'].filter((token) => {
        var tokenText= token.text.toLowerCase().replace(/[^A-Za-z0-9\s]/g, "");
        return token.page == pageIndex && !stopwords.includes(tokenText) && clipWords.includes(tokenText);
      }).map((token) => {
        return {...token, clip: clipId};
      });
    })
    if(allTokens.length == 0) 
      return [];
    
    return allTokens.reduce((prev, curr) => {
      return prev.concat(curr)
    })
  }

  function renderHighlightedBoundingBoxes(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    getTokens().map((token: Token, i: number) => {
        var bbox = scaleRawBoundingBox(token, pageDimensions.height, pageDimensions.width);

        // Only render this BoundingBox if it belongs on the current page
        const props = {
            ...bbox,
            id: pageIndex+'-'+token.id,
            className: 'reader_highlight_color-' + (token.clip % 7),
            // Set isHighlighted to true for highlighted styling
            isHighlighted: true,
            key: pageIndex+'-'+token.id,
        };

        boxes.push(<BoundingBox {...props} />);
    });
    return boxes;
  }

  return <React.Fragment>{renderHighlightedBoundingBoxes()}</React.Fragment>;
};
