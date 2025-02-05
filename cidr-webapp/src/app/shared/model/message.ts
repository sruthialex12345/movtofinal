import {Action} from './action';

export interface Message {
    from?: any;
    content?: any;
    action?: Action;
}
