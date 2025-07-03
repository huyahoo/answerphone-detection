# Answering Machine Detection

This module performs two core functions:
1. **dataから音声を復元する** - Convert binary audio data to WAV format
2. **復元した音声から文字起こしをする** - Transcribe WAV audio to text transcription

## Setup

1. Install dependencies:
```bash
cd data-2-wav-2-text
npm install
```

2. Set up Google Cloud credentials:
   - Place Google Cloud Speech API credentials file in `credentials/google-speech-api.json`

3. Place data files in the `data/` directory:
   - `{id}_data` - Binary audio data file
   - `{id}_timeSize` - Timing information file

## Usage

### Main Script (index.js)

Example
```bash
node index.js 1751421215833
```

Process both steps automatically:
```bash
node index.js [baseId]
```

Convert binary data to WAV only:
```bash
node index.js --wav-only [baseId]
```

Convert WAV to text only:
```bash
node index.js --text-only [baseId]
```

Show help:
```bash
node index.js --help
```

### Individual Scripts

Convert binary data to WAV:
```bash
node scripts/binaryDataToWav.js [baseId]
```

Convert WAV to text:
```bash
node scripts/speechToText.js [baseId]
```

## File Structure

```
answerphone-detection/
├── index.js                    # Main script
├── scripts/
│   ├── binaryDataToWav.js     # Convert binary data to WAV
│   └── speechToText.js        # Convert WAV to text
├── src/
│   ├── config/
│   │   └── AudioConfig.js     # Audio configuration
│   └── processors/
│       ├── AudioProcessor.js  # Audio processing logic
│       ├── SpeechProcessor.js # Speech-to-text processing
│       └── WavHeaderGenerator.js # WAV header generation
├── data/                      # Input data files
├── output/                    # Generated WAV and text files
├── credentials/               # Google Cloud credentials
└── test/                      # Test files
```

## Audio Specifications

- **Format**: PCM 16-bit, 8000Hz, mono
- **Input**: Binary audio data with timing information
- **Output**: WAV files and text transcriptions

## Examples

Process default file (1751421215833):
```bash
node index.js
```

Process specific file:
```bash
node index.js 1751421215833
```

Convert to WAV only:
```bash
node index.js 1751421215833 --wav-only
```

Convert to text only (requires existing WAV file):
```bash
node index.js 1751421215833 --text-only
``` 