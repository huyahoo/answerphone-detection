import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { AudioProcessor } from './AudioProcessor.js';
import { SpeechProcessor } from './SpeechProcessor.js';
import { PATHS } from '../config/AudioConfig.js';

/**
 * Batch Processor
 * Handles bulk processing of audio files in folders
 */
export class BatchProcessor {

  /**
   * Discovers audio files in a folder by looking for _data files
   * @param {string} folderPath - Path to folder containing audio files
   * @returns {Promise<Array>} Array of base IDs found
   */
  static async discoverAudioFiles(folderPath) {
    try {
      const files = await fs.readdir(folderPath);
      const baseIds = new Set();
      
      // Look for files ending with '_data'
      for (const file of files) {
        if (file.endsWith('_data')) {
          const baseId = file.replace('_data', '');
          
          // Check if corresponding _timeSize file exists
          const timeSizeFile = join(folderPath, `${baseId}_timeSize`);
          try {
            await fs.access(timeSizeFile);
            baseIds.add(baseId);
          } catch {
            console.warn(`Skipping ${baseId}: missing _timeSize file`);
          }
        }
      }
      
      return Array.from(baseIds).sort();
    } catch (error) {
      throw new Error(`Failed to discover audio files in ${folderPath}: ${error.message}`);
    }
  }

  /**
   * Creates output directory structure for a specific folder
   * @param {string} folderName - Name of the source folder
   * @returns {Promise<string>} Path to the created output directory
   */
  static async createOutputDirectory(folderName) {
    const outputDir = join(PATHS.OUTPUT_DIR, folderName);
    try {
      await fs.mkdir(outputDir, { recursive: true });
      return outputDir;
    } catch (error) {
      throw new Error(`Failed to create output directory ${outputDir}: ${error.message}`);
    }
  }

  /**
   * Updates PATHS configuration to use folder-specific output
   * @param {string} folderName - Name of the source folder
   * @returns {string} Original output directory path
   */
  static updateOutputPaths(folderName) {
    const originalOutputDir = PATHS.OUTPUT_DIR;
    PATHS.OUTPUT_DIR = join(originalOutputDir, folderName);
    return originalOutputDir;
  }

  /**
   * Restores original PATHS configuration
   * @param {string} originalOutputDir - Original output directory path
   */
  static restoreOutputPaths(originalOutputDir) {
    PATHS.OUTPUT_DIR = originalOutputDir;
  }

  /**
   * Processes a single file with complete pipeline
   * @param {string} baseId - Base identifier
   * @param {string} sourcePath - Path to source data files
   * @returns {Promise<Object>} Processing result
   */
  static async processCompleteWorkflow(baseId, sourcePath = null) {
    const startTime = Date.now();
    
    console.log(`Processing file: ${baseId}`);
    
    try {
      // Temporarily update PATHS if custom source path provided
      const originalDataDir = PATHS.DATA_DIR;
      if (sourcePath) {
        PATHS.DATA_DIR = sourcePath;
      }
      
      // Step 1: Convert binary data to WAV
      console.log('Converting binary data to WAV...');
      const wavResult = await AudioProcessor.processAudio(baseId);
      
      // Step 2: Convert WAV to text
      console.log('Converting WAV to text...');
      const textResult = await SpeechProcessor.processSpeech(baseId);
      
      // Step 3: Analyze for answering machine
      const answeringMachineDetected = this.detectAnsweringMachine(
        textResult.transcription.bestTranscript
      );
      
      // Restore original data directory
      if (sourcePath) {
        PATHS.DATA_DIR = originalDataDir;
      }
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`Completed ${baseId} in ${totalTime}s`);
      console.log(`Answering machine detected: ${answeringMachineDetected ? 'YES' : 'NO'}`);
      console.log('');
      
      return {
        baseId,
        success: true,
        processingTime: totalTime + 's',
        wav: wavResult,
        transcription: textResult,
        answeringMachine: {
          detected: answeringMachineDetected,
          transcript: textResult.transcription.bestTranscript,
          confidence: textResult.transcription.bestConfidence
        }
      };
      
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.error(`Failed ${baseId} in ${totalTime}s: ${error.message}`);
      console.log('');
      
      return {
        baseId,
        success: false,
        processingTime: totalTime + 's',
        error: error.message
      };
    }
  }

  /**
   * Processes all audio files in a folder
   * @param {string} folderPath - Path to folder containing audio files
   * @returns {Promise<Object>} Batch processing result
   */
  static async processFolderBatch(folderPath) {
    const startTime = Date.now();
    const folderName = basename(folderPath);
    
    console.log(`Processing folder: ${folderPath}`);
    console.log('');
    
    try {
      // Create folder-specific output directory
      await this.createOutputDirectory(folderName);
      
      // Update output paths to use folder-specific directory
      const originalOutputDir = this.updateOutputPaths(folderName);
      
      try {
        // Discover audio files
        console.log('Discovering audio files...');
        const baseIds = await this.discoverAudioFiles(folderPath);
        
        if (baseIds.length === 0) {
          throw new Error(`No audio files found in ${folderPath}`);
        }
        
        console.log(`Found ${baseIds.length} audio files: ${baseIds.join(', ')}`);
        console.log('');
        
        // Process each file
        const results = [];
        let successCount = 0;
        let failureCount = 0;
        let answeringMachineCount = 0;
        
        for (let i = 0; i < baseIds.length; i++) {
          const baseId = baseIds[i];
          
          console.log(`Processing ${i + 1}/${baseIds.length}: ${baseId}`);
          console.log('-'.repeat(50));
          
          const result = await this.processCompleteWorkflow(baseId, folderPath);
          results.push(result);
          
          if (result.success) {
            successCount++;
            if (result.answeringMachine.detected) {
              answeringMachineCount++;
            }
          } else {
            failureCount++;
          }
        }
        
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        // Generate summary
        console.log('='.repeat(60));
        console.log('BATCH PROCESSING SUMMARY');
        console.log('='.repeat(60));
        console.log(`Folder: ${folderPath}`);
        console.log(`Total Time: ${totalTime}s`);
        console.log(`Total Files: ${baseIds.length}`);
        console.log(`Successful: ${successCount}`);
        console.log(`Failed: ${failureCount}`);
        console.log(`Answering Machines: ${answeringMachineCount}`);
        console.log(`Success Rate: ${((successCount / baseIds.length) * 100).toFixed(1)}%`);
        console.log(`Detection Rate: ${successCount > 0 ? ((answeringMachineCount / successCount) * 100).toFixed(1) : 0}%`);
        console.log('');
        
        // List answering machine detections
        if (answeringMachineCount > 0) {
          console.log('ANSWERING MACHINE DETECTIONS:');
          results
            .filter(r => r.success && r.answeringMachine.detected)
            .forEach(r => {
              console.log(`  • ${r.baseId}: "${r.answeringMachine.transcript}"`);
              console.log(`    Confidence: ${(r.answeringMachine.confidence * 100).toFixed(1)}%`);
            });
          console.log('');
        }
        
        const batchResult = {
          folderPath,
          folderName,
          success: true,
          processingTime: totalTime + 's',
          summary: {
            totalFiles: baseIds.length,
            successCount,
            failureCount,
            answeringMachineCount,
            successRate: (successCount / baseIds.length),
            detectionRate: successCount > 0 ? (answeringMachineCount / successCount) : 0
          },
          results
        };
        
        return batchResult;
        
      } finally {
        // Always restore original output paths
        this.restoreOutputPaths(originalOutputDir);
      }
      
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.error(`Batch processing failed in ${totalTime}s: ${error.message}`);
      
      return {
        folderPath,
        folderName: basename(folderPath),
        success: false,
        processingTime: totalTime + 's',
        error: error.message
      };
    }
  }

  /**
   * Detects answering machine patterns in transcript
   * @param {string} transcript - Transcript text
   * @returns {boolean} True if answering machine detected
   */
  static detectAnsweringMachine(transcript) {
    if (!transcript || typeof transcript !== 'string') {
      return false;
    }
    
    const text = transcript.toLowerCase();
    
    // Japanese answering machine patterns
    const japanesePatterns = [
      '留守番電話', '留守電', 'るすでん', '不在',
      'ただいま', '外出中', '電話に出ることができません',
      'メッセージ', 'お話しください', 'お名前', 'ご用件',
      'しばらくお待ちください', '後ほど', 'かけ直し'
    ];
    
    // English answering machine patterns
    const englishPatterns = [
      'voicemail', 'answering machine', 'leave a message',
      'not available', 'away from', 'please leave',
      'after the tone', 'beep', 'recording',
      'currently unavailable', 'please call back'
    ];
    
    const allPatterns = [...japanesePatterns, ...englishPatterns];
    
    return allPatterns.some(pattern => text.includes(pattern));
  }

  /**
   * Exports batch processing results to CSV file
   * @param {Object} batchResult - Result from processFolderBatch
   * @returns {Promise<string>} Path to saved CSV file
   */
  static async exportResultsToCSV(batchResult) {
    const csvFilename = `${batchResult.folderName}-results.csv`;
    const csvPath = join(PATHS.OUTPUT_DIR, batchResult.folderName, csvFilename);
    
    try {
      // CSV headers as specified in japanese
      const headers = [
        'id',
        'テキスト', 
        'テキスト信頼度',
        '機械音声判定',
        'wavファイルパス',
        'txtファイルパス',
        '処理時間',
        '成功',
        'エラー'
      ];
      
      // Generate CSV rows
      const csvRows = [headers.join(',')];
      
      for (const result of batchResult.results) {
        const row = [
          `"${result.baseId}"`,
          `"${result.success ? (result.answeringMachine.transcript || '').replace(/"/g, '""') : ''}"`,
          result.success ? result.answeringMachine.confidence.toFixed(3) : '',
          result.success ? (result.answeringMachine.detected ? 'TRUE' : 'FALSE') : '',
          result.success ? `"${result.wav.files.wavFile}"` : '',
          result.success ? `"${result.transcription.files.txtFile}"` : '',
          `"${result.processingTime}"`,
          result.success ? 'TRUE' : 'FALSE',
          result.success ? '' : `"${(result.error || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      }
      
      const csvContent = csvRows.join('\n');
      await fs.writeFile(csvPath, csvContent, 'utf8');
      
      console.log(`Results exported to: ${csvPath}`);
      return csvPath;
      
    } catch (error) {
      console.warn(`Failed to export CSV results: ${error.message}`);
      return null;
    }
  }

  /**
   * Saves batch processing results to JSON file (deprecated, use CSV export)
   * @param {Object} batchResult - Result from processFolderBatch
   * @returns {Promise<string>} Path to saved results file
   */
  static async saveBatchResults(batchResult) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `batch-results-${batchResult.folderName}-${timestamp}.json`;
    const outputPath = join(PATHS.OUTPUT_DIR, batchResult.folderName, filename);
    
    try {
      await fs.writeFile(outputPath, JSON.stringify(batchResult, null, 2), 'utf8');
      console.log(`Batch results saved to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.warn(`Failed to save batch results: ${error.message}`);
      return null;
    }
  }
} 