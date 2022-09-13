import { BoundingBox, BoundingBoxType, UiContext, DocumentContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Highlight, Block, Clip } from '../types/clips';
import * as React from 'react';

type Props = {
    selectedBlocks: Array<number>;
    selectedClip: Array<number>;
    selectedMapping: number | null;
    createMapping: () => void;
    removeMapping: () => void;
    modifyMode: boolean;
    setModifyMode: (mode: boolean) => void;
};

/*
 * Example of BoundingBoxes used as text highlights
 */
export const AuthorMappingControls: React.FunctionComponent<Props> = ({ 
    selectedBlocks,
    selectedClip,
    selectedMapping,
    createMapping,
    removeMapping,
    modifyMode,
    setModifyMode,
}: Props) => {
    return (
        <div className="mapping-controls__container">
        {
            selectedBlocks.length > 0 && selectedClip[0] != -1 ? 
            <button onClick={createMapping} style={{backgroundColor: "#1890ff", borderColor: "#1890ff"}}>Create Mapping</button> :
            ""
        }
        {
            selectedMapping != null ? 
            [
                <button 
                    key="0" 
                    onClick={removeMapping} 
                    style={{backgroundColor: "#b00020", borderColor: "#b00020"}}
                >Remove Mapping</button> //,
                // <button 
                //     key="1" 
                //     onClick={() => setModifyMode(!modifyMode)} 
                //     style={{
                //         backgroundColor: modifyMode ? "#1890ff" : "#fff",
                //         color: modifyMode ? "#fff" : "#1890ff",
                //         borderColor: "#1890ff"
                //     }}
                // >{modifyMode ? "Modifying On" : "Modifying Off"}</button>
            ] :
            ""
        }
        </div>
    )   
};

