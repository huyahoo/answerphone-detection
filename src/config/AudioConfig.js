/**
 * Configuration for Answering Machine Detection
 * Simple constants and settings management
 */

export const AUDIO_CONFIG = {
  SAMPLE_RATE: 8000,
  CHANNELS: 1,
  BITS_PER_SAMPLE: 16,
  // CHUNK_SIZE: 320,
  
  get BYTE_RATE() {
    return this.SAMPLE_RATE * this.CHANNELS * (this.BITS_PER_SAMPLE / 8);
  },
  
  get BLOCK_ALIGN() {
    return this.CHANNELS * (this.BITS_PER_SAMPLE / 8);
  }
};

export const PATHS = {
  DATA_DIR: './data',
  OUTPUT_DIR: './output',
  CREDENTIALS: './credentials/google-speech-api.json'
};

export const WAV_HEADER = {
  SIZE: 44,
  RIFF_ID: 'RIFF',
  WAVE_ID: 'WAVE',
  FMT_ID: 'fmt ',
  DATA_ID: 'data',
  PCM_FORMAT: 1
};

export const PROCESSING = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  TIMEOUT_MS: 30000,
  ENCODING: 'binary'
}; 