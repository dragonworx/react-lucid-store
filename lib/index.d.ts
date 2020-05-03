interface StoreAPI<T> {
    id: string;
    store: T;
    undo: () => void;
    redo: () => void;
    undoCount: number;
    redoCount: number;
    watch: (...scopes: string[]) => void;
}
interface HashMap<T> {
    [key: string]: T;
}
interface Options {
    log: boolean;
}
export default function createStore<T extends HashMap<any>>(storeName: string, initialState: T, opts?: Partial<Options>): (name?: string) => StoreAPI<T>;
export {};
