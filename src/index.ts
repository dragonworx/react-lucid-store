import {
   useState,
   useEffect,
   Dispatch,
   SetStateAction,
   useRef,
} from 'react';
import { Observable, ObjectDeepPath, ObserverChange } from './object-observer';
import log from './log';

const newId = () => `#${Math.round(Math.random() * 100000)}`;

type Dispatcher = Dispatch<SetStateAction<any>>;

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

type BitHash = HashMap<true>;

interface BatchMap {
   [key: string]: ObserverChange[];
}

interface DispatcherWithScope {
   id: string;
   dispatcher: Dispatcher;
   scope: BitHash;
   name?: string;
}

interface Options {
   log: boolean;
}

type ChangeStack = (ObserverChange | ObserverChange[])[];

const defaultOptions: Options = {
   log: false,
};

export default function createStore<T extends HashMap<any>>(storeName: string, initialState: T, opts: Partial<Options> = {}) {
   const options = {
      ...defaultOptions,
      ...opts,
   };
   const dispatchers: HashMap<DispatcherWithScope> = {};
   const undoStack: ChangeStack = [];
   const redoStack: ChangeStack = [];
   const accessorIds: string[] = [];
   const batches: BatchMap = {};
   let bypassChanges = false;

   const peekAccessor = () => accessorIds[accessorIds.length - 1];

   if (options.log === true) {
      log.enabled = true;
   }

   const store = Observable.from({
      ...initialState
   });

   (window as any).store = store;

   const filteredPath = (path: ObjectDeepPath[]) => path.filter(item => typeof item !== 'symbol');

   const getPath = (change: ObserverChange): string =>
      filteredPath(change.path).map(item => {
         if (typeof item === 'string') {
            return item;
         }
         return `[${item}]`;
      })
         .join('.')
         .replace(/\.\[/g, '[')
         .replace(/\.\]/g, '[');

   store.observe((changes: ObserverChange[]) => {
      const changedPaths: BitHash = {};
      changes.forEach(change => {
         const { type, path: unfilteredPath, object } = change;
         const path = filteredPath(unfilteredPath);
         const isTrackableChange = bypassChanges === false && (type === 'update' || type === 'insert' || type === 'delete');
         let pathStr = getPath(change);
         if (type === 'access') {
            const id = peekAccessor();
            if (id) {
               const dispatcherWithScope = dispatchers[id];
               dispatchers[id].scope[pathStr] = true;
               log.write(`${storeName}.bind`, `[#${accessorIds.length}] ${id}`, dispatcherWithScope.name, pathStr);
            }
            return;
         } else if (type === 'insert' || type === 'delete') {
            pathStr = String(path[0]);
         }
         changedPaths[pathStr] = true;
         log.write(`${storeName}.change`, change);
         if (isTrackableChange) {
            const batchArray = batches[pathStr];
            if (batchArray) {
               batchArray.push(change);
               log.write(`${storeName}.batched`, pathStr, batchArray);
            } else {
               undoStack.push(change);
               redoStack.length = 0;
            }
         }
      });
      if (Object.keys(changedPaths).length) {
         update(changedPaths);
      }
   }, {
      enableGet: true
   });

   const update = (changedPaths: BitHash) => {
      const changedKeys = Object.keys(changedPaths);
      log.write(`${storeName}.update`, changedKeys);
      Object.keys(dispatchers).forEach((id) => {
         const dispatcherWithScope = dispatchers[id];
         if (!dispatcherWithScope) {
            // TODO: bug? happens only when deleting from array outside React loop
            return;
         }
         changedKeys.forEach(changedPath => {
            if (dispatcherWithScope.scope[changedPath]) {
               dispatcherWithScope.dispatcher(newId());
            } else {
               const dispatcherChangeKeys = Object.keys(dispatcherWithScope.scope);
               dispatcherChangeKeys.find(dispatcherChangeKey => {
                  if (dispatcherChangeKey === '*' || dispatcherChangeKey.indexOf(changedPath) === 0) {
                     dispatcherWithScope.dispatcher(newId());
                  }
               });
            }
         });
      });
   };

   const watch = (id: string) => (...paths: string[]) => {
      const dispatcherWithScope = dispatchers[id];
      const hash: BitHash = {};
      paths.forEach(path => hash[path] = true);
      log.write(`${storeName}.watch`, id, paths);
      dispatcherWithScope.scope = hash;
   };

   const batch = (id: string) => (...paths: string[]) => {
      paths.forEach(path => {
         if (!batches[path]) {
            log.write(`${storeName}.batch`, id, path);
            batches[path] = [];
         }
      });
   };

   const batchEnd = (id: string) => (...paths: string[]) => {
      paths.forEach(path => {
         const array = batches[path];
         if (array) {
            undoStack.push(array);
            log.write(`${storeName}.batchEnd`, id, path, array);
            delete batches[path];
         }
      });
   };

   const useThrottledBatch = (id: string) => (...paths: string[]) => {
      const [ timeoutId, setTimeoutId ] = useState(-1);
      return function () {
         batch(id)(...paths);
         const tid = setTimeout(() => {
            clearTimeout(timeoutId);
            batchEnd(id)(...paths);
            setTimeoutId(-1);
         }, 1000);
         setTimeoutId(tid);
      }
   };

   const useStore = (name?: string): StoreAPI<T> => {
      const dispatcher: Dispatcher = useState()[1];
      const id = useRef(newId()).current;

      if (options.log === true) {
         console.group(`useStore ${storeName}.${name}`, id);
      }

      if (!dispatchers[id]) {
         const dispatcherWithScope: DispatcherWithScope = {
            id,
            dispatcher,
            scope: {},
            name,
         };
         dispatchers[id] = dispatcherWithScope;
      }

      log.write(`${storeName}.push`, id, name);
      accessorIds.push(id);

      useEffect(() => {
         return () => {
            delete dispatchers[id];
         };
      }, []);

      useEffect(() => {
         log.write(`${storeName}.pop`, id, name, Object.keys(dispatchers[id].scope));
         if (options.log === true) {
            console.groupEnd();
         }
         accessorIds.pop();
      });

      return {
         id,
         store: store as unknown as T,
         undo,
         redo,
         undoCount: undoStack.length,
         redoCount: redoStack.length,
         watch: watch(id),
         batch: batch(id),
         batchEnd: batchEnd(id),
         useThrottledBatch: useThrottledBatch(id),
      };
   };

   const bypass = (fn: () => void) => {
      bypassChanges = true;
      fn();
      bypassChanges = false;
   }

   const setValue = (path: ObjectDeepPath[], value: any) => {
      let ref = store as any;
      let key = path[0];
      for (let i = 0; i < path.length - 1; i++) {
         key = path[i];
         ref = ref[String(key)];
      }
      bypass(() => ref[String(path[path.length - 1])] = value);
   };

   const undo = () => {
      const lastChange = undoStack.pop();
      if (lastChange) {
         redoStack.push(lastChange);
         const changes: ObserverChange[] = Array.isArray(lastChange) ? lastChange.reverse() : [lastChange];
         changes.forEach(change => {
            const { type, path: unfilteredPath, object, oldValue } = change;
            const path = filteredPath(unfilteredPath);
            log.write(`${storeName}.undo`, change);
            const key = `${path[path.length - 1]}`;
            if (type === 'update') {
               setValue(path, oldValue);
            } else if (type === 'delete') {
               bypass(() => {
                  if (Array.isArray(object)) {
                     object.splice(parseInt(key), 0, oldValue);
                  } else {
                     object[key] = oldValue;
                  }
               });
            } else if (type === 'insert') {
               bypass(() => {
                  if (Array.isArray(object)) {
                     object.splice(parseInt(key), 1);
                  } else {
                     delete object[key];
                  }
               });
            }
         });
      }
   };

   const redo = () => {
      const lastChange = redoStack.pop();
      if (lastChange) {
         undoStack.push(lastChange);
         const changes: ObserverChange[] = Array.isArray(lastChange) ? lastChange.reverse() : [lastChange];
         changes.forEach(change => {
            const { type, path: unfilteredPath, object, value } = change;
            const path = filteredPath(unfilteredPath);
            log.write(`${storeName}.redo`, change);
            const key = `${path[path.length - 1]}`;
            if (type === 'update') {
               setValue(path, value);
            } else if (type === 'delete') {
               bypass(() => {
                  if (Array.isArray(object)) {
                     object.splice(parseInt(key), 1);
                  } else {
                     delete object[key];
                  }
               });
            } else if (type === 'insert') {
               bypass(() => {
                  if (Array.isArray(object)) {
                     object.splice(parseInt(key), 0, value);
                  } else {
                     object[key] = value;
                  }
               });
            }
         });
      }
   };

   return useStore;
}