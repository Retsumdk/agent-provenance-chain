import { Command } from 'commander';
import { ProvenanceEngine } from './provenance.js';
import { hashContent } from './utils.js';
import fs from 'node:fs/promises';

const program = new Command();
const engine = new ProvenanceEngine();

program
  .name('provenance')
  .description('Agent Provenance Chain CLI')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize the provenance storage')
  .action(async () => {
    await engine.init();
    console.log('✓ Provenance storage initialized');
  });

program
  .command('record')
  .description('Record a new provenance event')
  .requiredOption('-t, --type <type>', 'Event type (creation, modification, access, deletion)')
  .requiredOption('-a, --agent-id <id>', 'Agent ID')
  .requiredOption('-o, --object-id <id>', 'Data object ID')
  .option('-p, --parents <ids>', 'Comma-separated parent event IDs')
  .option('-f, --file <path>', 'Path to data file to hash')
  .option('-c, --context <json>', 'Optional context as JSON string')
  .action(async (options) => {
    await engine.init();
    
    let hash = 'no-hash';
    if (options.file) {
      const content = await fs.readFile(options.file);
      hash = hashContent(content);
    }

    const event = await engine.recordEvent({
      type: options.type,
      agent: { id: options.agentId, type: 'cli' },
      dataObject: { id: options.objectId, type: 'file', hash },
      parentEventIds: options.parents ? options.parents.split(',') : [],
      context: options.context ? JSON.parse(options.context) : {},
    });

    console.log('✓ Event recorded:');
    console.log(JSON.stringify(event, null, 2));
  });

program
  .command('lineage <eventId>')
  .description('Get the lineage of an event')
  .action(async (eventId) => {
    await engine.init();
    const lineage = await engine.getLineage(eventId);
    console.log(`Lineage for event ${eventId}:`);
    console.table(lineage.map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      type: e.type,
      agent: e.agent.id,
      object: e.dataObject.id,
      parents: e.parentEventIds.length
    })));
  });

program
  .command('history <objectId>')
  .description('Get the history of a data object')
  .action(async (objectId) => {
    await engine.init();
    const history = await engine.getObjectHistory(objectId);
    console.log(`History for object ${objectId}:`);
    console.table(history.map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      type: e.type,
      agent: e.agent.id,
      hash: e.dataObject.hash.substring(0, 10) + '...'
    })));
  });

program
  .command('verify')
  .description('Verify the integrity of the provenance chain')
  .action(async () => {
    await engine.init();
    const result = await engine.verifyChain();
    if (result.valid) {
      console.log('✓ Provenance chain is valid and consistent');
    } else {
      console.error('✗ Integrity errors found:');
      result.errors.forEach(err => console.error(`  - ${err}`));
    }
  });

program
  .command('stats')
  .description('Get provenance chain statistics')
  .action(async () => {
    await engine.init();
    const stats = await engine.getStats();
    console.log('Provenance Chain Stats:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  });

program.parse();
