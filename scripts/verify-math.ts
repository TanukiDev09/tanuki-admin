import { toNumber } from '../src/lib/math';

const testCases = [
  { input: 123.45, expected: 123.45, name: 'Normal number' },
  { input: '123.45', expected: 123.45, name: 'String number' },
  {
    input: { $numberDecimal: '123.45' },
    expected: 123.45,
    name: 'MongoDB Decimal128 JSON',
  },
  {
    input: { toString: () => '123.45' },
    expected: 123.45,
    name: 'Object with toString',
  },
  { input: undefined, expected: 0, name: 'Undefined' },
  { input: null, expected: 0, name: 'Null' },
  { input: '', expected: 0, name: 'Empty string' },
];

console.log('Running math utility tests...');
let passed = 0;
for (const tc of testCases) {
  const result = toNumber(tc.input as any);
  if (result === tc.expected) {
    console.log(`✅ [PASS] ${tc.name}`);
    passed++;
  } else {
    console.error(
      `❌ [FAIL] ${tc.name}: expected ${tc.expected}, got ${result}`
    );
  }
}

console.log(`\nTests finished: ${passed}/${testCases.length} passed.`);
if (passed === testCases.length) {
  process.exit(0);
} else {
  process.exit(1);
}
