import {OffscreenRequestType} from './handlers/types';

export interface OffscreenRequestBundle {
    type: OffscreenRequestType;
    target: 'offscreen';
    data: any;
}

export interface OffscreenResponseBundle {
    data?: any;
    error?: string;
}
