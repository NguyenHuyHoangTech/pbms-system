const svg = `<svg xmlns="http://www.w3.org/2001/svg" viewBox="0 0 120 40"><text x="10" y="28" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1f2937">pay</text><text x="54" y="28" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#10b981">OS</text></svg>`;
console.log('data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'));
