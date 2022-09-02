import { BoundingBox, BoundingBoxType, HighlightOverlay, DocumentContext, UiContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Highlight, Clip, Token, Caption } from '../types/clips';
import * as React from 'react';

type Props = {
  pageIndex: number;
  clips: {[index: number]: Clip};
  highlights: {[index: number]: Highlight};
  hoveredWord: {clipId: number, text: string} | null;
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
    hoveredWord,
}: Props) => {
  const { isShowingTextHighlight } = React.useContext(UiContext);
  const { pageDimensions } = React.useContext(DocumentContext);

  console.log(hoveredWord);

  if (!isShowingTextHighlight) {
    return null;
  }

  function processText(text: string) {
    return text.toLowerCase().replace(/[^A-Za-z0-9\s]/g, "");
  }

  function getTokens() {
    if(hoveredWord == null) {
      return [];
    }
    
    var clip = clips[hoveredWord.clipId];
    var highlightId = clip.highlights[clip.position];
    var highlight = highlights[highlightId];
    var tokens = highlight['tokens'];
    
    return tokens.filter((token) => {
      return token.page == pageIndex && processText(token.text) == processText(hoveredWord.text);
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
            className: 'reader_highlight_color-' + (token.clip ? token.clip % 7 : 0),
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
