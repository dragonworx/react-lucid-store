declare module 'object-observer' {
   export interface Change {
      type: 'insert' | 'update' | 'delete' | 'shuffle' | 'reverse';
      path: Array<string | number>;
      value: any;
      oldValue: any;
      object: any;
   }

   export type ChangesHandler = (changes: Change[]) => void;

   export interface Options {
      path?: string;
      pathsOf?: string;
      pathsFrom?: string;
   }

   export class Observable {
      static from(obj: any): Observable;
      static isObservable(obj: any): boolean;
      observe(callback: ChangesHandler, options?: Options): void;
      unobserve(): void;
   }
}