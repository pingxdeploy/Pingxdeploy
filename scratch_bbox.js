const fs = require('fs');
const svg = fs.readFileSync('src/assets/icon.svg', 'utf-8');

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

const pathRegex = /<path d="([^"]+)"[^>]*transform="translate\(([^,]+),([^)]+)\)"/g;
let match;
while ((match = pathRegex.exec(svg)) !== null) {
    const pathD = match[1];
    const tx = parseFloat(match[2]);
    const ty = parseFloat(match[3]);

    const coordsRegex = /[MCLZ]\s*([^a-zA-Z]*)/g;
    let coordMatch;
    while ((coordMatch = coordsRegex.exec(pathD)) !== null) {
        const nums = coordMatch[1].trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
        for (let i = 0; i < nums.length; i += 2) {
            if (i + 1 >= nums.length) break;
            const x = nums[i] + tx;
            const y = nums[i+1] + ty;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
}

console.log(`Min X: ${minX}`);
console.log(`Min Y: ${minY}`);
console.log(`Max X: ${maxX}`);
console.log(`Max Y: ${maxY}`);
console.log(`Suggested viewBox: ${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
