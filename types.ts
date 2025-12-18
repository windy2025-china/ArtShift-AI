
export enum ArtStyle {
  RENAISSANCE = 'renaissance',
  WATERCOLOR = 'watercolor',
  CHINESE = 'chinese',
  COMIC = 'comic',
  PHOTOGRAPHY = 'photography',
  CYBERPUNK = 'cyberpunk',
  ANIME = 'anime',
  MANGA = 'manga',
  THREE_D = '3d',
  CUSTOM = 'custom'
}

export interface StyleOption {
  id: ArtStyle;
  label: string;
  icon: string;
  description: string;
  prompt: string;
}

export interface TextReplacement {
  original: string;
  replacement: string;
}

export interface EntityModification {
  entity: string;
  instruction: string;
}

export interface HistoryItem {
  id: string;
  originalUrl: string;
  transformedUrl: string;
  styleLabel: string;
  timestamp: number;
}

export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | 'original';
