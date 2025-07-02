# 🤖 Answering Machine Detection - Organized Structure

A simple but professional native JavaScript implementation for detecting answering machines using Google Cloud Speech-to-Text API.

## 📁 Project Structure

```
answerphone-detection/
├── 📂 src/                     # Core source code
│   ├── 📂 processors/          # Audio and speech processing
│   │   ├── AudioProcessor.js   # Audio data → WAV conversion
│   │   ├── SpeechProcessor.js  # WAV → Speech-to-text
│   │   └── WavHeaderGenerator.js # WAV header creation
│   ├── 📂 config/              # Configuration files
│   │   └── AudioConfig.js      # Audio specs & paths
│   └── 📂 utils/               # Utility functions (future)
├── 📂 scripts/                 # Executable scripts
│   ├── audio-to-wav.js         # Phase 1: Binary → WAV
│   ├── speech-recognition.js   # Phase 2: WAV → Text
│   └── full-pipeline.js        # Complete pipeline
├── 📂 test/                    # Test suite
│   └── test-suite.js           # Comprehensive tests
├── 📂 credentials/             # API credentials
│   └── google-speech-api.json  # Google Cloud credentials
├── 📂 data/                    # Input data files
├── 📂 output/                  # Generated outputs
├── 📂 docs/                    # Documentation
│   └── project-overview.md     # Project background
├── package.json               # Dependencies & scripts
├── index.js                   # Main entry point
└── README.md                  # This file
```

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Usage Options

**Option 1: Complete Pipeline**
```bash
npm start                    # Process default file
npm start 1751421215833      # Process specific file
```

**Option 2: Individual Phases**
```bash
npm run phase1              # Audio preprocessing only
npm run phase2              # Speech recognition only  
```

**Option 3: Direct Script Execution**
```bash
node scripts/audio-to-wav.js
node scripts/speech-recognition.js
node scripts/full-pipeline.js
```

**Testing**
```bash
npm test                     # Run comprehensive test suite
```

## 📋 Features

### Phase 1: Audio Preprocessing
- ✅ **Binary to WAV conversion** with proper headers
- ✅ **Timing data parsing** from Asterisk WebSocket format
- ✅ **Data validation** and consistency checks
- ✅ **Error handling** with helpful messages

### Phase 2: Speech Recognition  
- ✅ **Google Cloud Speech API v2** integration
- ✅ **Japanese/English language support** with fallback
- ✅ **Phone call optimized** model and settings
- ✅ **Basic answering machine detection** patterns

### Quality Features
- ✅ **Native ES modules** with modern JavaScript
- ✅ **Comprehensive error handling** with guidance
- ✅ **Performance tracking** and detailed logging
- ✅ **Memory management** and file size limits
- ✅ **Cross-platform compatibility**

## 🔧 Configuration

### Audio Specifications
- **Format**: PCM 16-bit, 8000Hz, Mono
- **Chunk Size**: 320 bytes (Asterisk standard)
- **Max File Size**: 50MB
- **Timeout**: 30 seconds

### File Paths
Configure in `src/config/AudioConfig.js`:
```javascript
export const PATHS = {
  DATA_DIR: './data',
  OUTPUT_DIR: './output', 
  CREDENTIALS: './credentials/google-speech-api.json'
};
```

## 📊 Data Format

### Input Files
```
data/
├── {id}_data          # Binary audio data
└── {id}_timeSize      # Timing: "timestamp/size,timestamp/size"
```

### Example Timing Format
```
0/320,38/320,76/320,114/320
```
- Each entry: `timestamp_ms/byte_count`
- Comma-separated timing entries

## 📝 Scripts Description

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `audio-to-wav.js` | Phase 1 preprocessing | Binary data + timing | WAV file |
| `speech-recognition.js` | Phase 2 transcription | WAV file | Text transcription |
| `full-pipeline.js` | Complete workflow | Binary data | Text + detection |

## 🧪 Testing

The test suite validates:
- ✅ Configuration constants
- ✅ WAV header generation
- ✅ Timing data parsing
- ✅ Answering machine detection logic
- ✅ File existence and validation
- ✅ Google Cloud credentials
- ✅ Output directory setup

## 🤖 Answering Machine Detection

### Detection Patterns

**Japanese Patterns:**
- 留守番電話, 留守電, 不在
- ただいま, 外出中
- メッセージ, お話しください

**English Patterns:**
- voicemail, answering machine
- leave a message, after the tone
- not available, away from

### Usage Example
```javascript
import { detectAnsweringMachine } from './scripts/speech-recognition.js';

const isAnsweringMachine = detectAnsweringMachine('留守番電話です');
// Returns: true
```

## 🔑 Google Cloud Setup

1. **Create credentials file:**
   ```
   credentials/google-speech-api.json
   ```

2. **Required fields:**
   ```json
   {
     "type": "service_account",
     "project_id": "your-project",
     "private_key": "...",
     "client_email": "..."
   }
   ```

3. **API requirements:**
   - Google Cloud Speech-to-Text API enabled
   - Service account with Speech API permissions

## 📈 Performance

### Processing Stats
- **Phase 1**: ~0.1-0.5s for typical audio files
- **Phase 2**: ~2-5s depending on audio length and API latency
- **Memory**: Efficient streaming with minimal memory footprint
- **Accuracy**: Optimized for Japanese telephony audio

## 🛠️ Development

### Adding New Features
1. **Processors**: Add to `src/processors/`
2. **Configuration**: Update `src/config/AudioConfig.js`
3. **Scripts**: Create in `scripts/` directory
4. **Tests**: Add to `test/test-suite.js`

### Code Style
- ES modules with modern syntax
- Static methods for processors
- Comprehensive error handling
- Clear separation of concerns

## 🔮 Roadmap

### Phase 3: Machine Learning
- [ ] **Feature extraction** from transcriptions
- [ ] **ML model training** for classification
- [ ] **Accuracy evaluation** and optimization
- [ ] **Real-time processing** capabilities

### Enhancements
- [ ] **Audio quality improvement** (noise reduction)
- [ ] **Multiple language support**
- [ ] **Confidence scoring** improvements
- [ ] **Docker containerization**

## 📞 Support

For issues or questions:
1. Check the **test suite** output for diagnostics
2. Verify **file paths** and permissions
3. Validate **Google Cloud credentials**
4. Review **error messages** for specific guidance

## 📜 License

MIT License - See LICENSE file for details. 