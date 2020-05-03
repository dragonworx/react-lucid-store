import * as React from 'react';
import { useStore } from './store';
import { randomBorder } from './util';

export default function Undo() {
   const { undo } = useStore('Undo');

   return <button onClick={undo} style={randomBorder()}>Undo</button>;
}
