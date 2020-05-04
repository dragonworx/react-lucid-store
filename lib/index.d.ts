interface StoreAPI<T> {
    id: string;
    store: T;
    undo: () => void;
    redo: () => void;
    undoCount: number;
    redoCount: number;
    watch: (...paths: string[]) => void;
    batch: (...paths: string[]) => void;
    batchEnd: (...paths: string[]) => void;
    useThrottledBatch: (...paths: string[]) => () => void;
}
interface HashMap<T> {
    [key: string]: T;
}
interface Options {
    log: boolean;
}
export default function createStore<T extends HashMap<any>>(storeName: string, initialState: T, opts?: Partial<Options>): (name?: string) => StoreAPI<T>;
export {};
