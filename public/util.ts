export const randomColor = () => {
   const r = Math.round(Math.random() * 255);
   const g = Math.round(Math.random() * 255);
   const b = Math.round(Math.random() * 255);
   return `rgb(${r},${g},${b})`;
}

export const randomBorder = () => ({
   border: `1px solid ${randomColor()}`,
})