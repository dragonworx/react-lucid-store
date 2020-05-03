export function clone(value: any) {
   if (Array.isArray(value)) {
      return [...value];
   } else if (isObjectLiteral(value)) {
      return {
         ...value
      };
   }
   return value;
}

export function replaceArray<T>(source: Array<T>, target: Array<T>) {
   source.length = 0;
   source.push.apply(source, target);
   return source;
}

export function isObjectLiteral(obj: any) {
   let temp = obj;
   return (typeof obj !== 'object' || obj === null ?
      false :
      (
         (function () {
            while (!false) {
               if (Object.getPrototypeOf(temp = Object.getPrototypeOf(temp)) === null) {
                  break;
               }
            }
            return Object.getPrototypeOf(obj) === temp;
         })()
      )
   );
}