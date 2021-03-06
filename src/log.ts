export default class Log {
   enabled: boolean = false;

   write(type: string, ...args: any[]) {
     if (this.enabled) {
      console.log(`%c ${type}`, 'color:cyan;font-weight:bold;', ...args);
     }
   }
}