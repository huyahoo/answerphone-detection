import { SpeechClient } from '@google-cloud/speech';
import { promises as fs } from 'fs';
import { PATHS, AUDIO_CONFIG } from '../config/AudioConfig.js';

/**
 * Speech Processor
 * Handles speech-to-text conversion using Google Cloud Speech API
 */
export class SpeechProcessor {
  
  static #client = null;
  
  /**
   * Gets or creates the Google Speech client
   * @returns {SpeechClient} Configured speech client
   */
  static getClient() {
    if (!this.#client) {
      try {
        this.#client = new SpeechClient({
          keyFilename: PATHS.CREDENTIALS
        });
      } catch (error) {
        throw new Error(`Failed to initialize Google Speech client: ${error.message}`);
      }
    }
    return this.#client;
  }

  /**
   * Creates speech recognition config for telephony audio
   * @returns {Object} Speech recognition configuration
   */
  static createRecognitionConfig() {
    return {
      encoding: 'LINEAR16',
      sampleRateHertz: AUDIO_CONFIG.SAMPLE_RATE,
      audioChannelCount: AUDIO_CONFIG.CHANNELS,
      languageCode: 'ja-JP', // Japanese for answering machine detection
      alternativeLanguageCodes: ['en-US'], // Fallback to English
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      model: 'phone_call', // Optimized for phone call audio
      useEnhanced: true, // Use enhanced model if available
      profanityFilter: false,
      speechContexts: [
        {
          // TODO: Update phrases to include more common phrases
          phrases: [
            'はい', 'もしもし', 'お疲れ様です', '留守番電話',
            'hello', 'yes', 'voicemail', 'answering machine'
          ],
          boost: 20 // Boost recognition of these common phrases
        }
      ]
    };
  }

  /**
   * Transcribes audio from WAV file
   * @param {string} wavFilePath - Path to WAV file
   * @returns {Promise<Object>} Transcription result
   */
  static async transcribeAudio(wavFilePath) {
    const startTime = Date.now();
    
    console.log(`Transcribing audio: ${wavFilePath}`);
    
    try {
      // Read audio file
      console.log('Reading WAV file...');
      const audioBytes = await fs.readFile(wavFilePath);
      
      // Prepare request
      const request = {
        audio: { content: audioBytes.toString('base64') },
        config: this.createRecognitionConfig()
      };
      
      // Send to Google Speech API
      console.log('Sending to Google Speech API...');
      const client = this.getClient();
      const [response] = await client.recognize(request);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Process results
      const results = this.processRecognitionResults(response);
      
      console.log(`Transcription completed in ${duration}s`);
      console.log(`Found ${results.transcripts.length} transcripts`);
      
      // if (results.bestTranscript) {
      //   console.log(`Best: "${results.bestTranscript}"`);
      // }
      
      return {
        success: true,
        filePath: wavFilePath,
        processingTime: duration + 's',
        ...results
      };
      
    } catch (error) {
      console.error(`Transcription failed: ${error.message}`);
      throw new Error(`Speech transcription failed: ${error.message}`);
    }
  }

  /**
   * Processes Google Speech API recognition results
   * @param {Object} response - API response
   * @returns {Object} Processed results
   */
  static processRecognitionResults(response) {
    const transcripts = [];
    let bestTranscript = '';
    let bestConfidence = 0;
    let totalWords = 0;
    
    if (response.results && response.results.length > 0) {
      for (const result of response.results) {
        if (result.alternatives && result.alternatives.length > 0) {
          const alternative = result.alternatives[0];
          
          transcripts.push({
            transcript: alternative.transcript,
            confidence: alternative.confidence || 0,
            words: alternative.words || []
          });
          
          // Track best transcript
          const confidence = alternative.confidence || 0;
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestTranscript = alternative.transcript;
          }
          
          totalWords += (alternative.words || []).length;
        }
      }
    }
    
    // Combine all transcripts with confidence > 0 to create transcribeText
    const validTranscripts = transcripts.filter(t => t.confidence > 0);
    const transcribeText = validTranscripts
      .map(t => t.transcript.trim())
      .filter(text => text.length > 0)
      .join('');
    
    // Calculate combined confidence as average of valid transcripts
    const transcribeConfidence = validTranscripts.length > 0
      ? validTranscripts.reduce((sum, t) => sum + t.confidence, 0) / validTranscripts.length
      : 0;
    
    return {
      transcripts,
      bestTranscript: bestTranscript.trim(),
      bestConfidence,
      transcribeText: transcribeText.trim(),
      transcribeConfidence,
      totalWords,
      isEmpty: transcripts.length === 0,
      averageConfidence: transcripts.length > 0 
        ? transcripts.reduce((sum, t) => sum + t.confidence, 0) / transcripts.length 
        : 0
    };
  }

  /**
   * Saves transcription results to text file
   * @param {Object} transcriptionResult - Result from transcribeAudio
   * @param {string} outputPath - Output text file path
   * @returns {Promise<Object>} Save result
   */
  static async saveTranscription(transcriptionResult, outputPath) {
    const content = this.formatTranscriptionOutput(transcriptionResult);
    
    try {
      await fs.writeFile(outputPath, content, 'utf8');
      
      return {
        success: true,
        filePath: outputPath,
        size: content.length
      };
    } catch (error) {
      throw new Error(`Failed to save transcription: ${error.message}`);
    }
  }

  /**
   * Formats transcription results for text output
   * @param {Object} result - Transcription result
   * @returns {string} Formatted content
   */
  static formatTranscriptionOutput(result) {
    const lines = [];
    
    lines.push('=== SPEECH TRANSCRIPTION RESULTS ===');
    lines.push(`File: ${result.filePath}`);
    lines.push(`Processing Time: ${result.processingTime}`);
    lines.push(`Success: ${result.success}`);
    lines.push('');
    
    if (result.transcribeText) {
      lines.push('=== COMBINED TRANSCRIPT ===');
      lines.push(result.transcribeText);
      lines.push(`Combined Confidence: ${(result.transcribeConfidence * 100).toFixed(1)}%`);
      lines.push('');
    }
    
    if (result.bestTranscript) {
      lines.push('=== BEST SINGLE TRANSCRIPT ===');
      lines.push(result.bestTranscript);
      lines.push(`Confidence: ${(result.bestConfidence * 100).toFixed(1)}%`);
      lines.push('');
    }
    
    if (result.transcripts && result.transcripts.length > 0) {
      lines.push('=== ALL TRANSCRIPTS ===');
      result.transcripts.forEach((transcript, index) => {
        lines.push(`${index + 1}. "${transcript.transcript}"`);
        lines.push(`   Confidence: ${(transcript.confidence * 100).toFixed(1)}%`);
        lines.push(`   Words: ${transcript.words.length}`);
        lines.push('');
      });
    }
    
    lines.push('=== STATISTICS ===');
    lines.push(`Total Transcripts: ${result.transcripts?.length || 0}`);
    lines.push(`Total Words: ${result.totalWords}`);
    lines.push(`Average Confidence: ${(result.averageConfidence * 100).toFixed(1)}%`);
    lines.push(`Is Empty: ${result.isEmpty}`);
    
    return lines.join('\n');
  }

  /**
   * Processes speech transcription for a base identifier
   * @param {string} baseId - Base identifier
   * @returns {Promise<Object>} Complete transcription result
   */
  static async processSpeech(baseId) {
    const wavFile = `${PATHS.OUTPUT_DIR}/${baseId}.wav`;
    const txtFile = `${PATHS.OUTPUT_DIR}/${baseId}.txt`;
    
    try {
      // Check if WAV file exists
      await fs.access(wavFile);
      
      // Transcribe audio
      const transcriptionResult = await this.transcribeAudio(wavFile);
      
      // Save transcription
      console.log('Saving transcription...');
      const saveResult = await this.saveTranscription(transcriptionResult, txtFile);
      
      console.log(`Saved to ${txtFile} (${saveResult.size} bytes)`);
      console.log('');
      
      return {
        baseId,
        success: true,
        files: { wavFile, txtFile },
        transcription: transcriptionResult,
        save: saveResult
      };
      
    } catch (error) {
      console.error(`Speech processing failed: ${error.message}`);
      throw new Error(`Speech processing failed for ${baseId}: ${error.message}`);
    }
  }
} 