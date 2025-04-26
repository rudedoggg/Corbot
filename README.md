# Corbot

A personal AI agent that can replicate itself with configurable specialities, act autonomously to pursue goals, and maintain secure, encrypted memory.

## Features (MVP)

- Single agent ("Corbot") with chat interface
- Persistent memory across sessions
- Multi-method authentication (username/password, passkey, Web3 wallet)
- Voice I/O capabilities (speech-to-text and text-to-speech)
- LLM-switching capability
- Simple replication with specialization support

## Getting Started

### Prerequisites

- Node.js 14+
- npm or yarn

### Installation

```bash
git clone <your-repository-url>
cd corbot
npm install
```

### Configuration

Create a `.env` file in the root directory with the following variables:

```properties
PORT=3000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
```

### Running the Framework

```bash
npm run dev
```

## Project Structure

```text
├── src/
│   ├── agents/       # Agent implementations and specialties
│   ├── core/         # Core framework classes
│   ├── config/       # Configuration
│   ├── services/     # Supporting services (LLM, memory, etc.)
│   ├── models/       # Data models
│   ├── middleware/   # Express middleware
│   ├── routes/       # API routes
│   └── utils/        # Utility functions
├── test/             # Tests
└── package.json
```

## Development Roadmap

1. Setup core agent framework
2. Implement chat and memory persistence
3. Add authentication methods
4. Integrate voice capabilities
5. Add LLM provider abstraction
6. Implement agent replication

## License

MIT
