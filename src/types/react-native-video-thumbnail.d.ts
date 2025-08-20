declare module 'react-native-video-thumbnail' {
  export interface CreateThumbnailOptions {
    url: string;
    timeStamp?: number;
    quality?: number;
    width?: number;
    height?: number;
    cacheName?: string;
    format?: 'jpeg' | 'png';
  }

  export interface ThumbnailResult {
    path: string;
    size: number;
    mime: string;
    width: number;
    height: number;
  }

  export function createThumbnail(options: CreateThumbnailOptions): Promise<ThumbnailResult>;
} 