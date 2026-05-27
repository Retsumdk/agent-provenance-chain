export type EventType = 'creation' | 'modification' | 'access' | 'deletion';

export interface AgentIdentity {
  id: string;
  name?: string;
  type: string; // e.g., 'llm', 'rule-based', 'human'
  version?: string;
}

export interface DataObject {
  id: string;
  type: string; // e.g., 'text', 'file', 'json'
  hash: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface ProvenanceEvent {
  id: string;
  timestamp: string;
  type: EventType;
  agent: AgentIdentity;
  dataObject: DataObject;
  parentEventIds: string[]; // For lineage
  signature?: string;
  context?: Record<string, any>;
}

export interface ChainStats {
  totalEvents: number;
  totalObjects: number;
  agentsInvolved: number;
  lastUpdate: string;
}
