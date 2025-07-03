import { promises as fs } from 'fs';
import { dirname } from 'path';
import { WavHeaderGenerator } from './WavHeaderGenerator.js';
import { PATHS, PROCESSING } from '../config/AudioConfig.js';

/**
 * Audio Processor
 * Handles conversion from binary audio data to WAV format
 */
export class AudioProcessor {

  /**
   * Parses timing data from timeSize file
   * @param {string} timeSizeContent - Raw content from timeSize file
   * @returns {Array} Array of {timestamp, size} objects
   */
  static parseTimingData(timeSizeContent) {
    return timeSizeContent
      .trim()
      .split(',')
      .filter(entry => entry.trim())
      .map((entry, index) => {
        const [timestamp, size] = entry.split('/');
        
        if (!timestamp || !size) {
          throw new Error(`Invalid timing entry at index ${index}: "${entry}"`);
        }
        
        const ts = parseInt(timestamp, 10);
        const sz = parseInt(size, 10);
        
        if (isNaN(ts) || isNaN(sz)) {
          throw new Error(`Invalid numbers in timing entry: "${entry}"`);
        }
        
        return { timestamp: ts, size: sz, index };
      });
  }

  /**
   * Gets timing statistics
   * @param {Array} timingEntries - Parsed timing entries
   * @returns {Object} Statistics object
   */
  static getTimingStats(timingEntries) {
    if (!timingEntries.length) return null;
    
    const timestamps = timingEntries.map(e => e.timestamp);
    const sizes = timingEntries.map(e => e.size);
    
    return {
      entryCount: timingEntries.length,
      minTimestamp: Math.min(...timestamps),
      maxTimestamp: Math.max(...timestamps),
      totalBytes: sizes.reduce((sum, size) => sum + size, 0),
      durationMs: Math.max(...timestamps) - Math.min(...timestamps),
      get durationSeconds() { return (this.durationMs / 1000).toFixed(2); },
      get averageSize() { return Math.round(this.totalBytes / this.entryCount); }
    };
  }

  /**
   * Reads and validates an audio data file
   * @param {string} filePath - Path to the data file
   * @returns {Promise<Buffer>} Audio data buffer
   */
  static async readAudioData(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size === 0) {
        throw new Error(`Audio file is empty: ${filePath}`);
      }
      
      if (stats.size > PROCESSING.MAX_FILE_SIZE) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${PROCESSING.MAX_FILE_SIZE})`);
      }
      
      return await fs.readFile(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Audio file not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Creates a WAV file from binary audio data
   * @param {Buffer} audioData - Binary audio data
   * @param {string} outputPath - Output WAV file path
   * @returns {Promise<Object>} Creation result with file info
   */
  static async createWavFile(audioData, outputPath) {
    // Generate WAV header
    const header = WavHeaderGenerator.generateHeader(audioData.length);
    
    // Combine header and audio data
    const wavData = Buffer.concat([header, audioData]);
    
    // Ensure output directory exists
    await this.ensureDirectory(dirname(outputPath));
    
    // Write WAV file
    await fs.writeFile(outputPath, wavData);
    
    return {
      filePath: outputPath,
      totalSize: wavData.length,
      audioDataSize: audioData.length,
      headerSize: header.length,
      headerInfo: WavHeaderGenerator.getHeaderInfo(audioData.length)
    };
  }

  /**
   * Ensures directory exists
   * @param {string} dirPath - Directory path
   */
  static async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Processes a complete audio conversion
   * @param {string} baseId - Base identifier (e.g., '1751421215833')
   * @returns {Promise<Object>} Complete processing result
   */
  static async processAudio(baseId) {
    const startTime = Date.now();
    
    console.log(`🎵 Processing audio: ${baseId}`);
    
    // Define file paths
    const dataFile = `${PATHS.DATA_DIR}/${baseId}_data`;
    const timeSizeFile = `${PATHS.DATA_DIR}/${baseId}_timeSize`;
    const wavFile = `${PATHS.OUTPUT_DIR}/${baseId}.wav`;
    
    try {
      // Read timing data
      console.log('Reading timing data...');
      const timingContent = await fs.readFile(timeSizeFile, 'utf8');
      const timingEntries = this.parseTimingData(timingContent);
      const timingStats = this.getTimingStats(timingEntries);
      
      console.log(`Parsed ${timingStats.entryCount} entries (${timingStats.durationSeconds}s)`);
      
      // Read audio data
      console.log('Reading audio data...');
      const audioData = await this.readAudioData(dataFile);
      
      console.log(`Loaded ${audioData.length} bytes`);
      
      // Validate data consistency
      if (timingStats.totalBytes !== audioData.length) {
        console.warn(`Timing total (${timingStats.totalBytes}) ≠ audio length (${audioData.length})`);
      }
      
      // Create WAV file
      console.log('Creating WAV file...');
      const wavInfo = await this.createWavFile(audioData, wavFile);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`Generated ${wavFile} (${(wavInfo.totalSize / 1024).toFixed(1)}KB) in ${duration}s`);
      
      return {
        baseId,
        success: true,
        files: { dataFile, timeSizeFile, wavFile },
        timing: timingStats,
        audio: {
          length: audioData.length,
          estimatedDuration: (audioData.length / 16000).toFixed(2) + 's' // 16000 = byte rate
        },
        wav: wavInfo,
        processingTime: duration + 's'
      };
      
    } catch (error) {
      console.error(`Processing failed: ${error.message}`);
      throw new Error(`Audio processing failed for ${baseId}: ${error.message}`);
    }
  }
} 