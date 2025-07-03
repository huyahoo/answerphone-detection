#!/usr/bin/env node

import { AudioProcessor } from '../src/processors/AudioProcessor.js';

/**
 * Convert binary audio data to WAV format
 */
async function binaryDataToWav(baseId = '1751421215833') {
  try {
    const result = await AudioProcessor.processAudio(baseId);
    
    console.log('Binary to WAV conversion successful');
    // console.log('WAV file:', result.files.wavFile);
    // console.log('Audio length:', result.audio.length, 'bytes');
    // console.log('Estimated duration:', result.audio.estimatedDuration);
    // console.log('WAV size:', (result.wav.totalSize / 1024).toFixed(1), 'KB');
    
    return result;
    
  } catch (error) {
    console.error('Binary to WAV conversion failed:', error.message);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const baseId = process.argv[2] || '1751421215833';
  binaryDataToWav(baseId).catch(console.error);
}

export { binaryDataToWav }; 