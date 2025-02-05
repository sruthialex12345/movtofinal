export interface MyGlobal {
}
export declare abstract class GlobalRef {
    readonly abstract nativeGlobal: MyGlobal;
}
export declare class BrowserGlobalRef extends GlobalRef {
    readonly nativeGlobal: MyGlobal;
}
