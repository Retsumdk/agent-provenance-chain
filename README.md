# Agent Provenance Chain

A system for tracking the origin and modification history of data generated or used by AI agents. This provides an immutable (file-based) record of data lineage, allowing for auditing and verification of how data evolved across multiple agent interactions.

## Features

- **Event-Based Tracking**: Record every creation, modification, access, or deletion of data.
- **Lineage Tracing**: Trace the complete history of an event back to its original sources.
- **Data Object History**: View all changes applied to a specific data object over time.
- **Integrity Verification**: Ensure the provenance chain remains consistent and reference-intact.
- **Agent Identity**: Tie every action to a specific agent identity and version.

## Installation

```bash
bun install
```

## Usage

### Initialize Storage
```bash
bun src/index.ts init
```

### Record a Provenance Event
```bash
bun src/index.ts record \
  --type creation \
  --agent-id agent-001 \
  --object-id doc-123 \
  --file ./my-data.json \
  --context '{"source": "web-search"}'
```

### View Data History
```bash
bun src/index.ts history doc-123
```

### Trace Event Lineage
```bash
bun src/index.ts lineage <event-id>
```

### Verify Chain Integrity
```bash
bun src/index.ts verify
```

## Architecture

The system uses a file-based storage model under `./.provenance`:
- `/events`: Contains individual JSON records for every recorded event.
- `/objects`: Contains index files mapping data object IDs to their associated event sequences.

### Provenance Event Structure
- `id`: Unique UUID for the event.
- `timestamp`: ISO 8601 timestamp.
- `type`: Action type (creation, modification, etc).
- `agent`: Identity of the agent that performed the action.
- `dataObject`: ID and hash of the data involved.
- `parentEventIds`: List of IDs representing the inputs to this action.

## Testing

```bash
bun test
```

## License

MIT
