import {
  BoundingBox,
  BoundingBoxType,
  DocumentContext,
  scaleRawBoundingBox,
  UiContext,
} from '@allenai/pdf-components';
import * as React from 'react';

import { Block, Clip, Highlight } from '../types/clips';

type Props = {
  clips: { [index: number]: Clip };
  selectedBlocks: Array<number>;
  selectedClip: Array<number>;
  selectedMapping: number | null;
  createMapping: () => void;
  removeMapping: () => void;
  modifyMode: boolean;
  setModifyMode: (mode: boolean) => void;
  highlightMode: boolean;
  setHighlightMode: (mode: boolean) => void;
  changeClipNote: (note: string) => void;
  changeClipSupp: (supp: boolean) => void;
  suggestedBlocks: Array<number>;
  scrollTo: (position: number) => void;
  currentSuggestion: number;
  setCurrentSuggestion: (idx: number) => void;
};

/*
 * Example of BoundingBoxes used as text highlights
 */
export const AuthorMappingControls: React.FunctionComponent<Props> = ({
  clips,
  selectedBlocks,
  selectedClip,
  selectedMapping,
  createMapping,
  removeMapping,
  modifyMode,
  setModifyMode,
  highlightMode,
  setHighlightMode,
  changeClipNote,
  changeClipSupp,
  suggestedBlocks,
  scrollTo,
  currentSuggestion,
  setCurrentSuggestion,
}: Props) => {
  const clickNavigator = (direction: number) => {
      var nextSuggestion = currentSuggestion;
      if(currentSuggestion == -1) {
        nextSuggestion = 0;
      } else {
        nextSuggestion += direction;
        if(nextSuggestion < 0) {
            nextSuggestion = suggestedBlocks.length - 1;
        } else if(nextSuggestion >= suggestedBlocks.length) {
            nextSuggestion = 0;
        }
      }

      var top = document.getElementById('block-' + suggestedBlocks[nextSuggestion])?.getBoundingClientRect().top;
      if(top != undefined) {
          scrollTo(top);
      }

      setCurrentSuggestion(nextSuggestion);
  }

  return (
    <div className="mapping-controls__container">
      {suggestedBlocks.length > 0 ?           
        <div className="reader_suggestion_navigator">
          <div className="reader_suggestion_navigator-btn" onClick={() => clickNavigator(-1)}>
              <i className="fas fa-chevron-left"></i>
          </div>
          <div className="reader_suggestion_navigator-label">
              {currentSuggestion != -1 ? [
                <div key={0} style={{fontSize: "10px"}}>
                  Suggested Blocks
                </div>,
                <div key={1}>
                  {currentSuggestion + 1} / {suggestedBlocks.length}
                </div>
                ] : <div style={{fontSize: "12px"}}> Go to a <br/> Suggested Block </div>}
          </div>
          <div className="reader_suggestion_navigator-btn" onClick={() => clickNavigator(1)}>
              <i className="fas fa-chevron-right"></i>
          </div>
        </div> :
        ''
      }
      {selectedBlocks.length > 0 && selectedClip[0] != -1 ? (
        <button
          className="mapping-controls__button"
          onClick={createMapping}
          style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}>
          Create Mapping
        </button>
      ) : (
        ''
      )}
      {selectedMapping != null ? 
          <div className="mapping-controls__button-container">
            <button
              className="mapping-controls__button"
              onClick={() => setHighlightMode(!highlightMode)}
              style={{
                backgroundColor: highlightMode ? '#1890ff' : '#fff',
                color: highlightMode ? '#fff' : '#1890ff',
                borderColor: '#1890ff',
              }}>
              {highlightMode ? 'Save Sync Highlight' : 'Create Sync Highlight'}
            </button>
            <button
              className="mapping-controls__button"
              onClick={removeMapping}
              style={{ backgroundColor: '#b00020', borderColor: '#b00020' }}>
              Remove Mapping
            </button>
          </div>
        : ''}
    </div>
  );
};



{/* <div key="2" className="mapping-controls__note-container">
<div className="mapping-controls__note-container-inner">
  <div>Note</div>
  <input
    type="text"
    className="mapping-controls__note-input"
    placeholder="Write a note for readers..."
    onChange={e => changeClipNote(e.target.value)}
    value={clips[selectedMapping].note ? clips[selectedMapping].note : ''}
  />
</div>
<div className="mapping-controls__note-container-inner">
  <div>Supplementary?</div>
  <input
    type="checkbox"
    className="mapping-controls__note-checkbox"
    onChange={e => changeClipSupp(e.target.checked)}
    checked={!!clips[selectedMapping].supplementary}
  />
</div>
</div>, */}