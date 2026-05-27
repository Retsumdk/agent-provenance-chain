import { 
  ProvenanceEvent, 
  AgentIdentity, 
  DataObject, 
  EventType, 
  ChainStats 
} from './types.js';
import { FileStorage } from './storage.js';
import { generateId, validateEvent } from './utils.js';

export class ProvenanceEngine {
  private storage: FileStorage;

  constructor(storageDir?: string) {
    this.storage = new FileStorage(storageDir);
  }

  async init() {
    await this.storage.init();
  }

  async recordEvent(params: {
    type: EventType;
    agent: AgentIdentity;
    dataObject: DataObject;
    parentEventIds?: string[];
    context?: Record<string, any>;
  }): Promise<ProvenanceEvent> {
    const event: ProvenanceEvent = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: params.type,
      agent: params.agent,
      dataObject: params.dataObject,
      parentEventIds: params.parentEventIds || [],
      context: params.context,
    };

    if (!validateEvent(event)) {
      throw new Error('Invalid event data');
    }

    await this.storage.saveEvent(event);
    await this.storage.saveObjectMapping(event.dataObject.id, event.id);

    return event;
  }

  async getLineage(eventId: string): Promise<ProvenanceEvent[]> {
    const lineage: ProvenanceEvent[] = [];
    const queue: string[] = [eventId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const event = await this.storage.getEvent(id);
      if (event) {
        lineage.push(event);
        queue.push(...event.parentEventIds);
      }
    }

    return lineage.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getObjectHistory(objectId: string): Promise<ProvenanceEvent[]> {
    const eventIds = await this.storage.getObjectHistory(objectId);
    const events: ProvenanceEvent[] = [];
    
    for (const id of eventIds) {
      const event = await this.storage.getEvent(id);
      if (event) {
        events.push(event);
      }
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async verifyChain(): Promise<{ valid: boolean; errors: string[] }> {
    const events = await this.storage.listEvents();
    const errors: string[] = [];
    const eventIds = new Set(events.map(e => e.id));

    for (const event of events) {
      // Check parent existence
      for (const parentId of event.parentEventIds) {
        if (!eventIds.has(parentId)) {
          errors.push(`Event ${event.id} references non-existent parent ${parentId}`);
        }
      }

      // Check timestamps
      for (const parentId of event.parentEventIds) {
        const parent = events.find(e => e.id === parentId);
        if (parent && new Date(parent.timestamp) > new Date(event.timestamp)) {
          errors.push(`Event ${event.id} has timestamp earlier than parent ${parentId}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async getStats(): Promise<ChainStats> {
    const events = await this.storage.listEvents();
    const agents = new Set(events.map(e => e.agent.id));
    const objects = new Set(events.map(e => e.dataObject.id));

    return {
      totalEvents: events.length,
      totalObjects: objects.size,
      agentsInvolved: agents.size,
      lastUpdate: events.length > 0 ? events[events.length - 1].timestamp : new Date().toISOString(),
    };
  }
}
