import { BoundingBoxType } from '@allenai/pdf-components';

export type Highlight = {
    id: string,
    type: string,
    rects: Array<BoundingBoxType>,
    clip: string,
}

export type Clip = {
    id: number,
    start: number,
    end: number,
    highlights: Array<number>,
    pageIndex: number,
    top: number,
}
