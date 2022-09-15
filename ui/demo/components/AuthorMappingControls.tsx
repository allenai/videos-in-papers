import { BoundingBox, BoundingBoxType, UiContext, DocumentContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Highlight, Block, Clip } from '../types/clips';
import * as React from 'react';

type Props = {
    clips: {[index: number]: Clip};
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
    changeClipSupp
}: Props) => {
    return (
        <div className="mapping-controls__container">
        {
            selectedBlocks.length > 0 && selectedClip[0] != -1 ? 
            <button 
                className="mapping-controls__button" 
                onClick={createMapping} 
                style={{backgroundColor: "#1890ff", borderColor: "#1890ff"}}
            >Create Mapping</button> :
            ""
        }
        {
            selectedMapping != null ? 
            [
                <div key="1" className="mapping-controls__button-container">
                    <button  
                        className="mapping-controls__button"
                        onClick={() => setHighlightMode(!highlightMode)} 
                        style={{
                            backgroundColor: highlightMode ? "#1890ff" : "#fff",
                            color: highlightMode ? "#fff" : "#1890ff",
                            borderColor: "#1890ff"
                        }}
                    >{highlightMode ? "Save Sync Highlight" : "Create Sync Highlight"}</button>
                    <button
                        className="mapping-controls__button"
                        onClick={removeMapping} 
                        style={{backgroundColor: "#b00020", borderColor: "#b00020"}}
                    >Remove Mapping</button> 
                </div>,
                <div key="2" className="mapping-controls__note-container">
                    <div className="mapping-controls__note-container-inner">
                        <div>Note</div>
                        <input 
                            type="text"
                            className="mapping-controls__note-input" 
                            placeholder="Write a note for readers..."
                            onChange={(e) => changeClipNote(e.target.value)}
                            value={clips[selectedMapping].note ? clips[selectedMapping].note : ""}
                        />
                    </div>
                    <div className="mapping-controls__note-container-inner">
                        <div>Supplementary?</div>
                        <input 
                            type="checkbox" 
                            className="mapping-controls__note-checkbox" 
                            onChange={(e) => changeClipSupp(e.target.checked)}
                            checked={!!clips[selectedMapping].supplementary}
                        />
                    </div>
                </div>
            ] :
            ""
        }
        </div>
    )   
};

