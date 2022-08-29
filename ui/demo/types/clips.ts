import { BoundingBoxType } from '@allenai/pdf-components';

export type Highlight = {
    id: number,
    type: string,
    rects: Array<BoundingBoxType>,
    clip: string,
}

export type Clip = {
    id: number,
    start: number,
    end: number,
    highlights: Array<number>,
    position: number;
    top: number;
    page: number;
}

export type Caption = {
    caption: string,
    start: number,
    end: number
}
