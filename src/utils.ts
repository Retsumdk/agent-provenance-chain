import { randomUUID, createHash } from 'node:crypto';

export function generateId(): string {
  return randomUUID();
}

export function hashContent(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

export function validateEvent(event: any): boolean {
  if (!event.id || !event.timestamp || !event.type || !event.agent || !event.dataObject) {
    return false;
  }
  return true;
}
