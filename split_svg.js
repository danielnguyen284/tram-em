const fs = require('fs');

const svgData = fs.readFileSync('public/images/logo-traced.svg', 'utf8');
const match = svgData.match(/d="([^"]+)"/);
if (!match) {
  console.log('No path found');
  process.exit(1);
}

const pathStr = match[1];
const subPaths = pathStr.split(/(?=M)/);

const parsedPaths = subPaths.map(sp => {
  const coords = [...sp.matchAll(/[\d.]+/g)].map(m => parseFloat(m[0]));
  if (coords.length === 0) return { sp, minX: 0, maxX: 0, minY: 0, maxY: 0 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < coords.length; i += 2) {
    if (coords[i] < minX) minX = coords[i];
    if (coords[i] > maxX) maxX = coords[i];
  }
  for (let i = 1; i < coords.length; i += 2) {
    if (coords[i] < minY) minY = coords[i];
    if (coords[i] > maxY) maxY = coords[i];
  }
  return { sp, minX, maxX, minY, maxY };
});

parsedPaths.forEach((p, i) => {
  console.log(`Subpath ${i}: X[${p.minX.toFixed(1)}, ${p.maxX.toFixed(1)}], Y[${p.minY.toFixed(1)}, ${p.maxY.toFixed(1)}]`);
});
