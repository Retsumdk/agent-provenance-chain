import fs from 'node:fs/promises';
import path from 'node:path';
import { ProvenanceEvent } from './types.js';

export class FileStorage {
  private storageDir: string;

  constructor(storageDir: string = './.provenance') {
    this.storageDir = storageDir;
  }

  async init() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      await fs.mkdir(path.join(this.storageDir, 'events'), { recursive: true });
      await fs.mkdir(path.join(this.storageDir, 'objects'), { recursive: true });
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  async saveEvent(event: ProvenanceEvent) {
    const filePath = path.join(this.storageDir, 'events', `${event.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(event, null, 2));
  }

  async getEvent(id: string): Promise<ProvenanceEvent | null> {
    const filePath = path.join(this.storageDir, 'events', `${id}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async listEvents(): Promise<ProvenanceEvent[]> {
    const eventsDir = path.join(this.storageDir, 'events');
    try {
      const files = await fs.readdir(eventsDir);
      const events: ProvenanceEvent[] = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(eventsDir, file), 'utf-8');
          events.push(JSON.parse(data));
        }
      }
      return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch {
      return [];
    }
  }

  async saveObjectMapping(objectId: string, eventId: string) {
    const filePath = path.join(this.storageDir, 'objects', `${objectId}.json`);
    let mappings: string[] = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      mappings = JSON.parse(data);
    } catch {
      // New object
    }
    if (!mappings.includes(eventId)) {
      mappings.push(eventId);
      await fs.writeFile(filePath, JSON.stringify(mappings, null, 2));
    }
  }

  async getObjectHistory(objectId: string): Promise<string[]> {
    const filePath = path.join(this.storageDir, 'objects', `${objectId}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}
