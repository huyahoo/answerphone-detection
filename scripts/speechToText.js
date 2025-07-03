#!/usr/bin/env node

import { SpeechProcessor } from '../src/processors/SpeechProcessor.js';

/**
 * Convert WAV audio to text transcription
 */
async function speechToText(baseId = '1751421215833') {
  try {
    const result = await SpeechProcessor.processSpeech(baseId);
    
    console.log('Speech to text conversion successful');
    // console.log('Text file:', result.files.txtFile);
    // console.log('Transcripts found:', result.transcription.transcripts.length);
    // console.log('Total words:', result.transcription.totalWords);
    // console.log('Average confidence:', (result.transcription.averageConfidence * 100).toFixed(1) + '%');
    
    if (result.transcription.transcribeText) {
      console.log('Combined transcript:', result.transcription.transcribeText);
      console.log('Combined confidence:', (result.transcription.transcribeConfidence * 100).toFixed(1) + '%');
      
      // Simple answering machine detection
      const isAnsweringMachine = detectAnsweringMachine(result.transcription.transcribeText);
      console.log('Answering machine detected:', isAnsweringMachine ? 'YES' : 'NO');
    } else {
      console.log('No transcription found - might be silence or noise');
    }
    
    return result;
    
  } catch (error) {
    console.error('Speech to text conversion failed:', error.message);
    
    if (error.message.includes('credentials')) {
      console.error('Make sure Google Cloud credentials are properly configured');
    }
    
    throw error;
  }
}

/**
 * Simple answering machine detection based on transcript content
 */
function detectAnsweringMachine(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return false;
  }
  
  const text = transcript.toLowerCase();
  
  // Japanese answering machine patterns
  const japanesePatterns = [
    '留守番電話', '留守電', 'るすでん', '不在',
    'ただいま', '外出中', '電話に出ることができません',
    'メッセージ', 'お話しください', 'お名前', 'ご用件'
  ];
  
  // English answering machine patterns
  const englishPatterns = [
    'voicemail', 'answering machine', 'leave a message',
    'not available', 'away from', 'please leave',
    'after the tone', 'beep', 'recording'
  ];
  
  const allPatterns = [...japanesePatterns, ...englishPatterns];
  
  return allPatterns.some(pattern => text.includes(pattern));
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const baseId = process.argv[2] || '1751421215833';
  speechToText(baseId).catch(console.error);
}

export { speechToText, detectAnsweringMachine }; 