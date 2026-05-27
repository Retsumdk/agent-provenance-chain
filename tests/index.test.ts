import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { ProvenanceEngine } from "../src/provenance.js";
import fs from "node:fs/promises";
import path from "node:path";

const TEST_DIR = "./.test-provenance";

describe("ProvenanceEngine", () => {
  let engine: ProvenanceEngine;

  beforeAll(async () => {
    engine = new ProvenanceEngine(TEST_DIR);
    await engine.init();
  });

  afterAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  test("should record an event", async () => {
    const event = await engine.recordEvent({
      type: 'creation',
      agent: { id: 'agent-1', type: 'test' },
      dataObject: { id: 'obj-1', type: 'test', hash: 'abc' },
    });

    expect(event.id).toBeDefined();
    expect(event.agent.id).toBe('agent-1');
    expect(event.dataObject.id).toBe('obj-1');
  });

  test("should retrieve object history", async () => {
    await engine.recordEvent({
      type: 'modification',
      agent: { id: 'agent-2', type: 'test' },
      dataObject: { id: 'obj-1', type: 'test', hash: 'def' },
    });

    const history = await engine.getObjectHistory('obj-1');
    expect(history.length).toBe(2);
    expect(history[0].type).toBe('creation');
    expect(history[1].type).toBe('modification');
  });

  test("should trace lineage", async () => {
    const event1 = await engine.recordEvent({
      type: 'creation',
      agent: { id: 'agent-1', type: 'test' },
      dataObject: { id: 'obj-2', type: 'test', hash: '123' },
    });

    const event2 = await engine.recordEvent({
      type: 'modification',
      agent: { id: 'agent-2', type: 'test' },
      dataObject: { id: 'obj-2', type: 'test', hash: '456' },
      parentEventIds: [event1.id]
    });

    const lineage = await engine.getLineage(event2.id);
    expect(lineage.length).toBe(2);
    expect(lineage[0].id).toBe(event1.id);
    expect(lineage[1].id).toBe(event2.id);
  });

  test("should verify chain integrity", async () => {
    const result = await engine.verifyChain();
    expect(result.valid).toBe(true);
  });

  test("should detect broken lineage", async () => {
    await engine.recordEvent({
      type: 'modification',
      agent: { id: 'agent-3', type: 'test' },
      dataObject: { id: 'obj-3', type: 'test', hash: '789' },
      parentEventIds: ['non-existent-id']
    });

    const result = await engine.verifyChain();
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('references non-existent parent');
  });
});
