import { AUDIO_CONFIG, WAV_HEADER } from '../config/AudioConfig.js';

/**
 * WAV Header Generator
 * Creates standard RIFF/WAVE format headers with native JavaScript
 */
export class WavHeaderGenerator {
  
  /**
   * Generates a complete WAV header buffer
   * @param {number} audioDataLength - Length of audio data in bytes
   * @returns {Buffer} 44-byte WAV header
   */
  static generateHeader(audioDataLength) {
    if (!Number.isInteger(audioDataLength) || audioDataLength < 0) {
      throw new Error(`Invalid audio data length: ${audioDataLength}`);
    }

    const header = Buffer.alloc(WAV_HEADER.SIZE);
    const totalSize = audioDataLength + 36;
    
    let offset = 0;

    // RIFF chunk descriptor (12 bytes)
    header.write(WAV_HEADER.RIFF_ID, offset); offset += 4;
    header.writeUInt32LE(totalSize, offset); offset += 4;
    header.write(WAV_HEADER.WAVE_ID, offset); offset += 4;

    // fmt sub-chunk (24 bytes)
    header.write(WAV_HEADER.FMT_ID, offset); offset += 4;
    header.writeUInt32LE(16, offset); offset += 4; // Sub-chunk size
    header.writeUInt16LE(WAV_HEADER.PCM_FORMAT, offset); offset += 2;
    header.writeUInt16LE(AUDIO_CONFIG.CHANNELS, offset); offset += 2;
    header.writeUInt32LE(AUDIO_CONFIG.SAMPLE_RATE, offset); offset += 4;
    header.writeUInt32LE(AUDIO_CONFIG.BYTE_RATE, offset); offset += 4;
    header.writeUInt16LE(AUDIO_CONFIG.BLOCK_ALIGN, offset); offset += 2;
    header.writeUInt16LE(AUDIO_CONFIG.BITS_PER_SAMPLE, offset); offset += 2;

    // data sub-chunk header (8 bytes)
    header.write(WAV_HEADER.DATA_ID, offset); offset += 4;
    header.writeUInt32LE(audioDataLength, offset);

    return header;
  }

  /**
   * Gets header information for debugging
   * @param {number} audioDataLength - Audio data length
   * @returns {Object} Header information
   */
  static getHeaderInfo(audioDataLength) {
    return {
      sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
      channels: AUDIO_CONFIG.CHANNELS,
      bitsPerSample: AUDIO_CONFIG.BITS_PER_SAMPLE,
      audioDataLength,
      byteRate: AUDIO_CONFIG.BYTE_RATE,
      blockAlign: AUDIO_CONFIG.BLOCK_ALIGN,
      headerSize: WAV_HEADER.SIZE,
      totalSize: audioDataLength + WAV_HEADER.SIZE
    };
  }
} 