import { BoundingBoxType } from '@allenai/pdf-components';

export type Highlight = {
    id: number,
    type: string,
    rects: Array<BoundingBoxType>,
    clip: string,
    tokens: Array<Token>,
    section: string,
}

export type Caption = {
    caption: string,
    start: number,
    end: number
}

export type Clip = {
    id: number,
    start: number,
    end: number,
    highlights: Array<number>,
    position: number;
    top: number;
    page: number;
    captions: Array<Caption>;
    expanded?: boolean;
    alternatives?: boolean;
}

export type Token = BoundingBoxType & {
    id: number,
    text: string,
    page: number,
    clip?: number,
}