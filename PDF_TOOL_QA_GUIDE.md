# PdfTool - QA Team Usage Guide

## Why this guide
This guide shows QA engineers how to use `PdfTool` in real Playwright tests with minimal setup.

Goal: keep your tests focused on business checks (Invoice Number, Total, Status, etc.) instead of PDF parsing code.

---

## What `PdfTool` gives you

- Parse PDF from buffer in one line.
- Normalize PDF text to reduce flaky failures.
- Reusable assertions for fields, amounts, regex patterns, and negative checks.
- Better error messages when validation fails.

---

## 1) Quick start (copy-paste template)

Use this in any Playwright test file.

```ts
import { test, expect } from '@playwright/test';
import { PdfTool } from '../src/pdf-tool-lib/PdfTool';

test('verify invoice PDF with PdfTool', async ({ request }) => {
  // 1) Download PDF from API/UI endpoint
  const response = await request.get('http://localhost:4200/assets/sample-invoice.pdf');
  expect(response.ok()).toBeTruthy();

  // 2) Get bytes and parse PDF
  const buffer = await response.body();
  const pdf = await PdfTool.fromBuffer(buffer);

  // 3) Run business assertions
  await pdf.assertContains('INVOICE');
  await pdf.assertFieldEquals('Total Amount Due', 'USD 4,785.00');
  await pdf.assertNumericFieldEquals('Total Amount Due', 4785, { tolerance: 1 });
});
```

That is all you need for most PDF checks.

---

## 2) Most useful assertions for QA

### Content checks

```ts
await pdf.assertContains('ACME Corporation');
await pdf.assertNotContains('DRAFT');
await pdf.assertContainsAll(['INVOICE', 'Total', 'USD']);
```

### Field checks

```ts
await pdf.assertFieldEquals('Invoice Number', 'INV-2024-00123');
await pdf.assertFieldContainsOneOf('Status', ['Approved', 'APPROVED', 'Pending Approval']);
```

### Numeric checks

```ts
await pdf.assertNumericFieldEquals('Total Amount Due', 4785, { tolerance: 0.01 });
await pdf.assertFieldBetween('Total Amount Due', 4000, 5000);
```

### Regex checks

```ts
await pdf.assertMatches(/\d{4}-\d{2}-\d{2}/);     // Date format
await pdf.assertNotMatches(/CANCELLED|VOID/i);      // Invalid status markers
```

### Line-order checks

```ts
await pdf.assertContainsLines(['INVOICE', 'Total'], { unordered: false }); // in order
await pdf.assertContainsLines(['USD', 'INVOICE'], { unordered: true });     // any order
```

---

## 3) How to handle dynamic content (dates, IDs, changing values)

Use options in `fromBuffer(...)` so tests stay stable.

```ts
const pdf = await PdfTool.fromBuffer(buffer, {
  normalizeWhitespace: true,
  normalizeUnicode: true,
  ignoreCase: false,
  ignoreFields: ['Invoice Date', 'Due Date', 'Invoice Number'],
  replacePatterns: [
    { pattern: /\b\d{4}-\d{2}-\d{2}\b/g, replacement: '<DATE>' },
    { pattern: /INV-\d+/g, replacement: '<INVOICE_ID>' },
  ],
});
```

When to use each:

- `ignoreFields`: when whole field value changes every run.
- `replacePatterns`: when only specific dynamic fragments should be normalized.
- `normalizeWhitespace`: when spacing/newlines vary by render engine.

---

## 4) Full document regression check (fixture-based)

Use this when you want a strong snapshot-style validation.

```ts
import fs from 'fs';
import path from 'path';

const expectedText = fs.readFileSync(
  path.join(__dirname, '../fixtures/expected-invoice.txt'),
  'utf-8',
);

await pdf.assertFullContentEquals(expectedText, {
  ignoreFields: ['Invoice Date', 'Invoice Number'],
});
```

Good for release validation when document structure is expected to stay stable.

---

## 5) Practical test patterns for QA suites

### Pattern A: API-generated PDF

1. Call API endpoint with Playwright `request`.
2. Parse `response.body()` via `PdfTool.fromBuffer(...)`.
3. Validate business fields and totals.

### Pattern B: UI download + API verify

1. Trigger download button via UI.
2. Verify source PDF URL or API response.
3. Parse buffer and run `PdfTool` assertions.

### Pattern C: Multi-document smoke

Loop through multiple PDF endpoints and run a small common assertion set:

- Must contain document type keyword.
- Must not contain invalid markers (`DRAFT`, `VOID`, etc.).
- Must contain at least one business identifier.

---

## 6) Troubleshooting

### Error: no extractable text

Meaning: PDF likely has no text layer (image/scanned PDF).

What to do:

- Confirm if PDF is digital text PDF.
- If scanned/image-only, OCR is needed before text assertions.

### Field not found

Meaning: exact label may differ in PDF.

What to do:

- Check `pdf.getTextRaw()` output.
- Try case-insensitive option (`ignoreCase: true`).
- Adjust field label to match PDF text exactly.

### Unexpected mismatch due to formatting

What to do:

- Enable `normalizeWhitespace` and `normalizeUnicode`.
- Add `replacePatterns` for dynamic formats.

---

## 7) QA best practices

- Prefer field and numeric assertions over long raw text assertions.
- Keep assertions business-focused (status, totals, IDs, customer info).
- Use `assertNotContains`/`assertNotMatches` for safety checks.
- Use `ignoreFields` for unstable metadata.
- Keep one shared helper file per team to standardize default options.

---

## 8) Minimal reusable helper (recommended)

Create a helper function once and reuse in all tests.

```ts
import { PdfTool } from '../src/pdf-tool-lib/PdfTool';

export async function parsePdfForQa(buffer: Uint8Array) {
  return PdfTool.fromBuffer(buffer, {
    normalizeWhitespace: true,
    normalizeUnicode: true,
    ignoreCase: false,
  });
}
```

Then in tests:

```ts
const pdf = await parsePdfForQa(buffer);
await pdf.assertContains('INVOICE');
```

---

## 9) Summary

`PdfTool` helps QA teams write cleaner, stable, and reusable PDF tests by providing:

- One parsing entry point,
- Standard text normalization,
- Rich assertion helpers,
- Faster debugging when tests fail.

Use it as your default PDF validation layer in Playwright tests.
