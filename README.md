# Answering Machine Detection

This module performs a complete telephony analysis pipeline:
1. **Binary Audio Conversion** - Convert proprietary binary phone data to WAV format
2. **Speech Recognition** - Transcribe WAV audio to text using Google Cloud Speech API
3. **Answering Machine Detection** - Analyze transcripts to identify answering machines

The system supports both **single file processing** and **batch processing** of entire folders.

## Setup

1. Install dependencies:
```bash
cd answerphone-detection
npm install
```

2. Set up Google Cloud credentials:
   - Place Google Cloud Speech API credentials file in `credentials/google-speech-api.json`

3. Prepare data files:
   - **Single files**: Place in `data/` directory as `{id}_data` and `{id}_timeSize`
   - **Batch folders**: Create date-based folders like `data/20250702/` containing multiple file pairs

## Usage

### Batch Processing (Recommended)

Process all audio files in a folder:
```bash
node index.js --folder data/20250702
```

Process folder with relative path:
```bash
node index.js --folder 20250702
```

Export results to CSV:
```bash
node index.js --folder data/20250702 --export-csv
```

Save detailed results to JSON:
```bash
node index.js --folder data/20250702 --save-results
```

### Single File Complete Workflow

Full pipeline for one file:
```bash
node index.js --file 1751421215833
```

### Standard Processing (Backward Compatible)

Process with standard syntax:
```bash
node index.js 1751421215833              # Full pipeline
node index.js --wav-only 1751421215833   # WAV conversion only
node index.js --text-only 1751421215833  # Speech-to-text only
```

Show help:
```bash
node index.js --help
```

### Individual Scripts (Advanced)

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
├── index.js                   # Main entry point with batch processing
├── scripts/
│   ├── binaryDataToWav.js     # Binary to WAV conversion
│   └── speechToText.js        # Speech-to-text conversion
├── src/
│   ├── config/
│   │   └── AudioConfig.js     # Audio format configuration
│   └── processors/
│       ├── AudioProcessor.js  # Binary audio processing
│       ├── SpeechProcessor.js # Google Cloud Speech integration
│       ├── WavHeaderGenerator.js # WAV format header creation
│       └── BatchProcessor.js  # Folder batch processing
├── data/                      # Input data organization
├── output/                    # Generated files
├── credentials/               # Google Cloud API credentials
└── docs/                      # Documentation
```

## Audio Specifications

- **Format**: PCM 16-bit, 8000Hz, mono (telephony standard)
- **Input**: Binary audio data with timing information files
- **Output**: WAV files, text transcriptions, and answering machine detection results

## Data Preparation

### Single Files
```bash
# Place individual files in data/ directory
data/
├── 1751421215833_data      # Binary audio data
└── 1751421215833_timeSize  # Timing information
```

### Batch Folders (Recommended)
```bash
# Create date-based folders with multiple call files
data/
└── 20250702/              # Date folder (YYYYMMDD)
    ├── 1751443864734_data       # First call binary data
    ├── 1751443864734_timeSize   # First call timing
    ├── 1751443864733_data       # Second call binary data
    ├── 1751443864733_timeSize   # Second call timing
    └── ...                # Additional calls
```

### Data Import
```bash
# Download and extract data archives
cd data
tar -xf 20250702.zip       # Creates 20250702/ folder
```

## Examples & Expected Output

### Batch Processing (Full Day Analysis)

```bash
# Process all calls from July 2, 2025
node index.js --folder 20250702
```

**Expected Output:**
```
Processing folder: data/20250702

Discovering audio files...
Found 15 audio files: call001, call002, call003...

Processing 1/15: call001
--------------------------------------------------
Processing file: call001
Converting binary data to WAV...
Converting WAV to text...
Completed call001 in 2.1s
Answering machine detected: NO

Processing 2/15: call002
--------------------------------------------------
Processing file: call002
Converting binary data to WAV...
Converting WAV to text...
Completed call002 in 1.9s
Answering machine detected: YES

[... continues for all files ...]

============================================================
BATCH PROCESSING SUMMARY  
============================================================
Folder: data/20250702
Total Time: 45.3s
Total Files: 15
Successful: 14
Failed: 1
Answering Machines: 3
Success Rate: 93.3%
Detection Rate: 21.4%

ANSWERING MACHINE DETECTIONS:
  • call002: "ただいま外出中です。メッセージをお話しください。"
    Confidence: 87.5%
  • call007: "留守番電話にメッセージをどうぞ"
    Confidence: 92.1%
  • call012: "We're not available right now, please leave a message"
    Confidence: 89.3%
```

### Single File Complete Workflow

```bash
# Analyze one specific call
node index.js --file call001
```

**Expected Output:**
```
Single File Complete Workflow - Processing: call001

Processing file: call001
Converting binary data to WAV...
Generated output/call001/call001.wav (45.2KB) in 0.8s

Converting WAV to text...
Transcription completed in 1.2s
Found 1 transcripts

Completed call001 in 2.1s
Answering machine detected: NO
```

### Standard Processing Examples

```bash
# Backward compatible processing
node index.js 1751421215833              # Full pipeline
node index.js --wav-only 1751421215833   # WAV conversion only  
node index.js --text-only 1751421215833  # Speech-to-text only
```

### CSV Export

```bash
# Process folder and export CSV results
node index.js --folder 20250702 --export-csv
```

### JSON Export

```bash
# Process folder and save detailed JSON report
node index.js --folder 20250702 --save-results
```