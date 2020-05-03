import * as React from 'react';
import { useStore } from './store';
import { randomBorder } from './util';

export default function AddButton() {
   const { store: { items } } = useStore('AddButton');

   const onAddClick = () => items.push({
      title: `New Item ${items.length + 1}`,
      count: 0,
   })

   return (
      <button style={randomBorder()} onClick={onAddClick}>Add</button>
   );
}