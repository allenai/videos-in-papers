import { BoundingBoxType } from '@allenai/pdf-components';

export type Highlight = {
  id: number;
  type: string;
  rects: Array<BoundingBoxType>;
  clip: number;
  tokens: Array<Token>;
  section: string;
  blocks?: Array<number>;
};

export type Caption = {
  id: number;
  caption: string;
  start: number;
  end: number;
};

export type Clip = {
  id: number;
  start: number;
  end: number;
  highlights: Array<number>;
  position: number;
  top: number;
  page: number;
  captions: Array<Caption>;
  expanded?: boolean;
  alternatives?: boolean;
  note?: string;
  supplementary?: boolean;
};

export type Token = BoundingBoxType & {
  id: number;
  text: string;
  page: number;
  clip?: number;
};

export type Block = BoundingBoxType & {
  id: number;
  index: number;
  type: string;
  section: string;
  tokens: Array<Token>;
};

export type SyncWords = {
  clipId: number;
  tokenIds: Array<{ blockIdx: number; tokenIdx: number }>;
  captionIds: Array<{ captionIdx: number; wordIdx: number }>;
};
