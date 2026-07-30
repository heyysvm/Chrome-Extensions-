import { test } from 'node:test';
import assert from 'node:assert';
import { cosineSimilarity } from '../utils/vector.js';
test('cosineSimilarity calculates exact matches', () => {
    const vecA = [1, 2, 3];
    const vecB = [1, 2, 3];
    const score = cosineSimilarity(vecA, vecB);
    assert.ok(Math.abs(score - 1.0) < 1e-6);
});
test('cosineSimilarity calculates orthogonal vectors', () => {
    const vecA = [1, 0];
    const vecB = [0, 1];
    const score = cosineSimilarity(vecA, vecB);
    assert.strictEqual(score, 0);
});
test('cosineSimilarity returns 0 for zero vectors', () => {
    const vecA = [0, 0];
    const vecB = [1, 2];
    const score = cosineSimilarity(vecA, vecB);
    assert.strictEqual(score, 0);
});
