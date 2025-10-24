// Script to generate extended CSV with new clinical factors
// Run this once to update the dat.csv file

import { extendCSV } from '../utils/extendCsvData';

async function main() {
  try {
    // Read existing CSV
    const response = await fetch('/dat.csv');
    const csvText = await response.text();
    
    console.log('Original CSV loaded. Extending with new columns...');
    
    // Generate extended CSV
    const extendedCSV = await extendCSV(csvText);
    
    console.log('Extended CSV generated successfully!');
    console.log('Sample of first 3 rows:');
    console.log(extendedCSV.split('\n').slice(0, 3).join('\n'));
    
    // Download the extended CSV
    const blob = new Blob([extendedCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dat_extended.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Download started! File: dat_extended.csv');
    console.log('Replace the original public/dat.csv with this file.');
    
  } catch (error) {
    console.error('Error generating extended CSV:', error);
  }
}

// Auto-run when loaded
if (typeof window !== 'undefined') {
  main();
}

export { main };
