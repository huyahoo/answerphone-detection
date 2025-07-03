#!/usr/bin/env node

import { join } from 'path';
import { BatchProcessor } from './src/processors/BatchProcessor.js';
import { binaryDataToWav } from './scripts/binaryDataToWav.js';
import { speechToText } from './scripts/speechToText.js';

function showUsage() {
  console.log('Answering Machine Detection');
  console.log('===========================');
  console.log('');
  console.log('Usage:');
  console.log('  node index.js [baseId] [options]                 # Single file processing');
  console.log('  node index.js --file <baseId>                    # Single file complete workflow');
  console.log('  node index.js --folder <folder-path>             # Batch folder processing');
  console.log('');
  console.log('Options:');
  console.log('  --wav-only      Convert binary data to WAV only (single file mode)');
  console.log('  --text-only     Convert WAV to text only (single file mode)');
  console.log('  --export-csv    Export batch results to CSV file (folder mode only)');
  console.log('  --save-results  Save batch results to JSON file (folder mode only)');
  console.log('  --help          Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  # Single file processing');
  console.log('  node index.js                             # Process default file (1751421215833)');
  console.log('  node index.js 1751421215833               # Process specific file');
  console.log('  node index.js --wav-only 1751421215833    # Convert binary to WAV only');
  console.log('  node index.js --text-only 1751421215833   # Convert WAV to text only');
  console.log('');
  console.log('  # Complete workflow processing');
  console.log('  node index.js --file 1751421215833        # Full pipeline for single file');
  console.log('  node index.js --folder data/20250702      # Process all files in folder');
  console.log('  node index.js --folder 20250702 --export-csv      # Process and export CSV');
  console.log('  node index.js --folder ./data/20250702 --save-results  # Process and save JSON');
  console.log('');
  console.log('Folder Structure:');
  console.log('  data/20250702/           # Date-based folder');
  console.log('  ├── file1_data          # Binary audio data');
  console.log('  ├── file1_timeSize      # Timing information');
  console.log('  ├── file2_data          # Another audio file');
  console.log('  └── file2_timeSize      # Corresponding timing file');
  console.log('');
  console.log('Output Structure:');
  console.log('  output/20250702/         # Folder-specific output');
  console.log('  ├── file1.wav           # Generated WAV files');
  console.log('  ├── file1.txt           # Transcription files');
  console.log('  └── 20250702-results.csv # CSV export (if requested)');
  console.log('');
}

async function processStandardWorkflow(args) {
  const baseId = args.find(arg => !arg.startsWith('--')) || '1751421215833';
  const wavOnly = args.includes('--wav-only');
  const textOnly = args.includes('--text-only');
  
  console.log('Standard Mode - Processing file:', baseId);
  console.log('');
  
  try {
    const startTime = Date.now();
    let wavResult, textResult;
    
    // Step 1: Convert binary data to WAV
    if (!textOnly) {
      console.log('Converting binary data to WAV...');
      wavResult = await binaryDataToWav(baseId);
      console.log('');
    }
    
    // Step 2: Convert WAV to text
    if (!wavOnly) {
      console.log('Converting WAV to text...');
      textResult = await speechToText(baseId);
      console.log('');
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Standard processing completed in ${totalTime}s`);
    
    return { success: true, wav: wavResult, text: textResult };
    
  } catch (error) {
    console.error('Standard processing failed:', error.message);
    process.exit(1);
  }
}

async function processCompleteWorkflowSingle(fileId) {
  console.log('Single File Complete Workflow - Processing:', fileId);
  console.log('');
  
  try {
    const result = await BatchProcessor.processCompleteWorkflow(fileId);
    
    if (!result.success) {
      console.error('Single file processing failed');
      process.exit(1);
    }
    
    return result;
    
  } catch (error) {
    console.error('Single file processing failed:', error.message);
    process.exit(1);
  }
}

async function processFolderBatchWorkflow(folderPath, exportCsv = false, saveResults = false) {
  console.log('Folder Batch Processing - Processing:', folderPath);
  console.log('');
  
  try {
    // Resolve folder path relative to data directory if not absolute
    let resolvedPath = folderPath;
    if (!folderPath.startsWith('/') && !folderPath.startsWith('\\') && !folderPath.includes(':')) {
      // Relative path - check if it starts with data/
      if (!folderPath.startsWith('data/')) {
        resolvedPath = join('data', folderPath);
      }
    }
    
    const result = await BatchProcessor.processFolderBatch(resolvedPath);
    
    if (!result.success) {
      console.error('Folder processing failed');
      process.exit(1);
    }
    
    // Export to CSV if requested
    if (exportCsv) {
      await BatchProcessor.exportResultsToCSV(result);
    }
    
    // Save JSON results if requested
    if (saveResults) {
      await BatchProcessor.saveBatchResults(result);
    }
    
    return result;
    
  } catch (error) {
    console.error('Folder processing failed:', error.message);
    process.exit(1);
  }
}

function parseArguments(args) {
  const folderIndex = args.indexOf('--folder');
  const fileIndex = args.indexOf('--file');
  
  if (folderIndex !== -1 && fileIndex !== -1) {
    throw new Error('Cannot use both --folder and --file options');
  }
  
  if (folderIndex !== -1) {
    const folderPath = args[folderIndex + 1];
    if (!folderPath) {
      throw new Error('--folder requires a folder path');
    }
    return {
      mode: 'folder',
      path: folderPath,
      exportCsv: args.includes('--export-csv'),
      saveResults: args.includes('--save-results')
    };
  }
  
  if (fileIndex !== -1) {
    const fileId = args[fileIndex + 1];
    if (!fileId) {
      throw new Error('--file requires a file ID');
    }
    return {
      mode: 'complete-workflow',
      fileId: fileId
    };
  }
  
  // Standard processing mode detection
  const hasStandardFlags = args.some(arg => 
    arg === '--wav-only' || arg === '--text-only'
  );
  
  const hasNonFlagArgs = args.some(arg => 
    !arg.startsWith('--') && arg !== '--help' && arg !== '-h'
  );
  
  if (hasStandardFlags || hasNonFlagArgs || args.length === 0) {
    return {
      mode: 'standard',
      args: args
    };
  }
  
  throw new Error('Invalid arguments. Use --help for usage information.');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }
  
  try {
    const config = parseArguments(args);
    
    switch (config.mode) {
      case 'standard':
        await processStandardWorkflow(config.args);
        break;
        
      case 'complete-workflow':
        await processCompleteWorkflowSingle(config.fileId);
        break;
        
      case 'folder':
        await processFolderBatchWorkflow(config.path, config.exportCsv, config.saveResults);
        break;
        
      default:
        throw new Error('Unknown processing mode');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('');
    console.log('Use --help for usage information.');
    process.exit(1);
  }
}

main().catch(console.error); 