#!/usr/bin/env node

import { binaryDataToWav } from './scripts/binaryDataToWav.js';
import { speechToText } from './scripts/speechToText.js';

function showUsage() {
  console.log('Answering Machine Detection');
  console.log('===========================');
  console.log('');
  console.log('Usage:');
  console.log('  node index.js [baseId] [options]');
  console.log('');
  console.log('Options:');
  console.log('  --wav-only      Convert binary data to WAV only');
  console.log('  --text-only     Convert WAV to text only');
  console.log('  --help          Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node index.js                    # Process default file (1751421215833)');
  console.log('  node index.js 1751421215833      # Process specific file');
  console.log('  node index.js --wav-only         # Convert binary to WAV only');
  console.log('  node index.js --text-only        # Convert WAV to text only');
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }
  
  const baseId = args.find(arg => !arg.startsWith('--')) || '1751421215833';
  const wavOnly = args.includes('--wav-only');
  const textOnly = args.includes('--text-only');
  
  console.log('Processing file:', baseId);
  console.log('');
  
  try {
    const startTime = Date.now();
    let wavResult, textResult;
    
    // Step 1: Convert binary data to WAV
    if (!textOnly) {
      console.log('Converting binary data to WAV...');
      wavResult = await binaryDataToWav(baseId);
      // console.log('WAV file created:', wavResult.files.wavFile);
      console.log('');
    }
    
    // Step 2: Convert WAV to text
    if (!wavOnly) {
      console.log('Converting WAV to text...');
      textResult = await speechToText(baseId);
      // console.log('Text file created:', textResult.files.txtFile);
      console.log('');
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Completed in ${totalTime}s`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error); 