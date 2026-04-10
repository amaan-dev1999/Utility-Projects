# PdfTool Enhancements - Comprehensive Guide

## Overview
The enhanced `PdfTool` is now a production-ready, general-purpose PDF content verification library for QA automation. It handles edge cases, provides detailed error reporting, and supports complex PDF validation scenarios.

---

## New Features & Edge Cases Covered

### 1. **Unicode & Character Normalization** ✅
**Problem:** PDFs often contain smart quotes, em-dashes, ligatures that don't match plain text.

**Solution:** Automatic normalization of:
- Smart quotes (`"` → `"`)
- Single smart quotes (`'` → `'`)
- Em-dashes & en-dashes (`—`/`–` → `-`)
- Soft hyphens (removed)
- Ligatures (`ﬁ` → `fi`)
- Thin spaces (→ regular space)

**Usage:**
```typescript
const pdf = await PdfTool.fromBuffer(buffer, {
    normalizeUnicode: true  // Default: true
});
```

**Edge Cases Handled:**
- PDFs with mixed quote styles
- Typographically-formatted documents
- Documents copied from word processors

---

### 2. **Multiline Field Value Extraction** ✅
**Problem:** Original code only captured field values until the first newline.

**Solution:** Multiple helper methods:

**Extract Single Field:**
```typescript
await pdf.assertFieldEquals('Shipping Address', 'Street, City, State ZIP');
```

**Extract All Occurrences (repeated fields):**
```typescript
const amounts = await pdf.extractAllFieldValues('Item Amount');
// Returns: ['100.00', '250.00', '150.00']
```

**Match One of Multiple Values:**
```typescript
await pdf.assertFieldContainsOneOf('Status', [
    'Approved',
    'APPROVED',
    'Pending Approval'
]);
```

**Edge Cases Handled:**
- Invoice line items (repeated fields)
- Multiple customer entries
- Status variations

---

### 3. **Numeric/Amount Comparison with Tolerance** ✅
**Problem:** `USD 1,000.00` vs `1000.00` vs `USD1000` fail despite being identical.

**Solution:**

**Exact Numeric Comparison with Tolerance:**
```typescript
await pdf.assertNumericFieldEquals('Total Amount Due', 4785.00, {
    tolerance: 0.01  // Allow $0.01 difference
});
```

**Range Validation:**
```typescript
await pdf.assertFieldBetween('Invoice Total', 100, 5000);
// Fails if total < 100 or > 5000
```

**Features:**
- Extracts numeric values from formatted strings
- Handles currency symbols, commas, decimals
- Configurable tolerance for floating-point comparisons

**Edge Cases Handled:**
- Currency formatting variations (USD 1,000 vs USD1000 vs $1000)
- Decimal precision expectations
- International number formatting

---

### 4. **Order-Independent Content Verification** ✅
**Problem:** Content exists but in unexpected order breaks tests.

**Solution:**

**Ordered Line Matching:**
```typescript
await pdf.assertContainsLines([
    'Invoice Header',
    'Line Items',
    'Total Amount'
], { unordered: false });
```

**Unordered Content Matching:**
```typescript
await pdf.assertContainsLines([
    'Total: 1000',
    'Customer: ACME',
    'Invoice Date: 2024-01'
], { unordered: true });  // Order doesn't matter
```

**Bulk Content Verification:**
```typescript
await pdf.assertContainsAll([
    'INVOICE',
    'Total',
    'USD',
    'Company Name'
]);
```

**Edge Cases Handled:**
- PDFs with dynamic field order
- Multi-column layouts
- Variable document structure

---

### 5. **Negative Assertions** ✅
**Problem:** Need to verify things DON'T exist (e.g., no draft watermark).

**Solution:**

```typescript
await pdf.assertNotContains('DRAFT');
await pdf.assertNotMatches(/CANCELLED|VOID/i);
```

**Edge Cases Handled:**
- Verification documents don't have restricted status
- Invoices don't contain test data markers

---

### 6. **Enhanced Error Messages with Context** ✅
**Problem:** Vague errors make debugging difficult for QA.

**Solution:** Detailed error messages with snippets:

```
Field "Total Amount Due" does not contain a numeric value. Got: "Not Available"
PDF does not contain all expected content. Missing: ["Authorization Code", "Signature"]
PDF full content does not match expected content.
--- Expected ---
Invoice Header
Item 1: $100...
--- Actual ---
Different Content
...
```

**Debugging Support:**
```typescript
const rawText = pdf.getTextRaw();        // Unmodified PDF text
const normalized = pdf.getTextNormalized(); // With options applied
const lines = pdf.getLines();             // Split & filtered lines
```

---

### 7. **Pattern Validation & Regex Support** ✅
**Problem:** Need flexible pattern-based assertions.

**Solution:**

```typescript
await pdf.assertMatches(/Invoice #\d{6}/);
await pdf.assertMatches(/\d{4}-\d{2}-\d{2}/);  // Date format
await pdf.assertMatches(/USD\s+[\d,]+\.\d{2}/);  // Amount format
```

**Custom Pattern Replacement (for comparison):**
```typescript
const pdf = await PdfTool.fromBuffer(buffer, {
    replacePatterns: [
        { pattern: /\d{4}-\d{2}-\d{2}/g, replacement: '<DATE>' },
        { pattern: /\d{6}/g, replacement: '<ID>' }
    ]
});
```

**Edge Cases Handled:**
- Date format variations
- ID patterns with different lengths
- Currency format variations
- Phone/SSN/Account number patterns

---

### 8. **Table Extraction** ✅
**Problem:** Need to verify structured data (line items, pricing tables).

**Solution:**

```typescript
const lineItems = await pdf.extractTable(
    /Items?:/i,              // Start pattern
    /Total Amount/i          // End pattern
);

// Returns array of rows with parsed data
for (const row of lineItems) {
    console.log(row.raw);      // Original text
    console.log(row.values);   // Parsed values pipe-separated
}
```

**Edge Cases Handled:**
- Variable column spacing
- Multi-line row values
- Optional table sections

---

### 9. **Extractable Text Validation** ✅
**Problem:** Image-only PDFs (scans, screenshots) fail silently.

**Solution:**

```typescript
const pdf = await PdfTool.fromBuffer(buffer);

if (pdf.hasExtractableText()) {
    // Proceed with text assertions
} else {
    // Handle image-only PDF
}
```

**Automatic Validation:**
```typescript
// Throws error immediately if PDF has no extractable text
const pdf = await PdfTool.fromBuffer(imageOnlyPdf);
// Error: "PDF contains no extractable text. This may be an image-only PDF..."
```

**Edge Cases Handled:**
- Scanned documents
- Screenshot PDFs
- Locked/encrypted PDFs with no text layer

---

### 10. **Case-Insensitive Matching** ✅
**Problem:** Field names might have different cases.

**Solution:**

```typescript
const pdf = await PdfTool.fromBuffer(buffer, {
    ignoreCase: true
});

await pdf.assertFieldEquals('total amount due', 'USD 4,785.00');
// Matches "Total Amount Due", "TOTAL AMOUNT DUE", etc.
```

---

## Complete API Reference

### Main Methods

| Method | Purpose | Edge Cases |
|--------|---------|-----------|
| `getTextRaw()` | Get unmodified PDF text | Debugging differences |
| `getTextNormalized()` | Get text with options applied | Verify normalization |
| `getLines()` | Get split & filtered lines | Line-by-line analysis |
| `hasExtractableText()` | Check if PDF has text | Detect image-only PDFs |
| `assertFullContentEquals()` | Compare entire content | Full-document validation |
| `assertContains()` | Check substring exists | Basic content checks |
| `assertNotContains()` | Check substring absent | Negative assertions |
| `assertMatches()` | Regex pattern matching | Flexible formats |
| `assertNotMatches()` | Regex pattern absent | Status/type checking |
| `assertContainsLines()` | Multiple lines exist | Order-independent checks |
| `assertContainsAll()` | All content pieces exist | Bulk validation |
| `assertFieldEquals()` | Field value matches | Field-based validation |
| `extractAllFieldValues()` | Get all field occurrences | Repeated fields |
| `assertFieldContainsOneOf()` | Field matches one value | Value variations |
| `assertNumericFieldEquals()` | Numeric value with tolerance | Amount formatting |
| `assertFieldBetween()` | Numeric range validation | Amount ranges |
| `extractTable()` | Parse tabular data | Structured content |

---

## PdfToolOptions Configuration

```typescript
interface PdfToolOptions {
    normalizeWhitespace?: boolean;    // Default: true
    ignoreCase?: boolean;              // Default: false
    normalizeUnicode?: boolean;        // Default: true
    removePatterns?: RegExp[];         // Patterns to remove
    replacePatterns?: Array<{          // Patterns to replace
        pattern: RegExp;
        replacement: string;
    }>;
    ignoreFields?: string[];           // Fields to mask as <IGNORED_FIELD>
    multilineFields?: boolean;         // Default: false (reserved for future)
}
```

---

## Real-World Examples

### Example 1: Invoice Validation
```typescript
const pdf = await PdfTool.fromBuffer(buffer, {
    ignoreFields: ['Invoice Number', 'Invoice Date', 'Due Date'],
    replacePatterns: [
        { pattern: /\d{4}-\d{2}-\d{2}/g, replacement: '<DATE>' }
    ]
});

await pdf.assertContains('ACME Corporation');
await pdf.assertFieldEquals('Total Amount Due', 'USD 4,785.00');
await pdf.assertNumericFieldEquals('Total Amount Due', 4785, { tolerance: 1 });
await pdf.assertFieldBetween('Total Amount Due', 4000, 5000);
await pdf.assertMatches(/Invoice #\d+/);
```

### Example 2: Multi-Status Document
```typescript
const pdf = await PdfTool.fromBuffer(buffer, {
    ignoreCase: true
});

await pdf.assertFieldContainsOneOf('Status', [
    'Approved',
    'Pending Review',
    'Ready to Process'
]);

await pdf.assertNotContains('REJECTED');
await pdf.assertNotMatches(/HOLD|CANCELLED/);
```

### Example 3: Flexible Content Checking
```typescript
const pdf = await PdfTool.fromBuffer(buffer);

// All these must exist, but order doesn't matter
await pdf.assertContainsLines([
    'Total: $1,500',
    'Customer: ABC Inc',
    'Payment Received: Yes'
], { unordered: true });
```

### Example 4: Table-Based Validation
```typescript
const pdf = await PdfTool.fromBuffer(buffer);

const items = await pdf.extractTable(
    /Line Items/i,
    /Subtotal/i
);

expect(items.length).toBeGreaterThan(0);
expect(items[0].raw).toContain('Item');
```

---

## Advanced Patterns

### Pattern for Repeated Content
```typescript
const pdf = await PdfTool.fromBuffer(buffer);

// Check if all payment records are present
const payments = await pdf.extractAllFieldValues('Payment');
expect(payments).toContain('Cash: 1000');
expect(payments).toContain('Credit: 500');
```

### Pattern for Template Validation
```typescript
const pdf = await PdfTool.fromBuffer(buffer, {
    replacePatterns: [
        { pattern: /\d+/g, replacement: '<NUM>' },
        { pattern: /[a-z]+/gi, replacement: '<WORD>' }
    ]
});

// Now compare against standardized template format
await pdf.assertContains('Invoice: <NUM>');
```

---

## Test Coverage

The comprehensive test suite (`pdf-tool.spec.ts`) now includes:

✅ Basic content extraction  
✅ Field extraction with separators  
✅ Multiline field handling  
✅ Numeric comparison with tolerance  
✅ Range validation  
✅ Unicode normalization  
✅ Pattern matching (regex)  
✅ Negative patterns  
✅ Content presence checks  
✅ Line-based assertions (ordered/unordered)  
✅ Custom normalization options  
✅ Error scenarios & edge cases  
✅ Fixture-based validation  
✅ Table extraction  
✅ Comprehensive integration test  

---

## Debugging Tips

### 1. Save extracted text for inspection
```typescript
const pdf = await PdfTool.fromBuffer(buffer);
fs.writeFileSync('debug.txt', pdf.getTextNormalized());
```

### 2. Compare raw vs normalized
```typescript
console.log('Raw:', pdf.getTextRaw().substring(0, 200));
console.log('Normalized:', pdf.getTextNormalized().substring(0, 200));
```

### 3. Inspect individual lines
```typescript
const lines = pdf.getLines();
lines.forEach((line, i) => console.log(`[${i}] ${line}`));
```

### 4. Test patterns before asserting
```typescript
const regex = /Invoice #\d+/;
if (regex.test(pdf.getTextRaw())) {
    await pdf.assertMatches(regex);
}
```

---

## Migration from Old Version

All old methods still work:
- ✅ `assertContains()` - unchanged
- ✅ `assertFieldEquals()` - enhanced with better errors
- ✅ `assertMatches()` - unchanged
- ✅ `assertFullContentEquals()` - enhanced with diffs

New methods are strictly additional functionality.

---

## Performance Considerations

- Normalization happens once at construction
- Pattern extraction is memoized
- Unicode normalization only if enabled
- Table extraction is lazy (on-demand)

For large PDFs with multiple assertions, consider:
```typescript
const pdf = await PdfTool.fromBuffer(buffer);
// Perform all assertions on same instance
await pdf.assertContains('X');
await pdf.assertContains('Y');
// (avoid creating multiple instances)
```

---

## Summary: What's Now Truly "General"

The PdfTool can now handle:

✅ Any PDF with extractable text  
✅ Various field formats and separators  
✅ Unicode & special character variations  
✅ Numeric values in different formats  
✅ Repeated/multiline field values  
✅ Dynamic content order  
✅ Structured tabular data  
✅ Pattern-based validation  
✅ Range & tolerance checking  
✅ Comprehensive error reporting  
✅ Image-only PDF detection  

**Use Cases:**
- Invoice/receipt validation
- Contract verification
- Report generation testing
- Form filling validation
- Multi-language document testing
- Template compliance checking
- Financial document validation

---

# Publishing PdfTool as a Reusable Library

## Overview
PdfTool can be shared across multiple projects using various distribution methods. This guide explains how to convert it into a reusable library and distribute it.

## Distribution Approaches

### Comparison of Methods

| Method | Visibility | Setup Complexity | Version Control | Best For |
|--------|-----------|------------------|-----------------|----------|
| **NPM Package** | Public/Private Org | Medium | ✅ Semantic Versioning | Public libraries, wide adoption |
| **GitHub Package Registry** | Private/Public | Low | ✅ Semantic Versioning | Internal teams, private packages |
| **Monorepo Workspace** | Single Repo | Low | ✅ Atomic commits | Multiple projects in same org |
| **Tarball Distribution** | Manual Share | Very Low | ❌ Manual tracking | Quick sharing, one-off projects |
| **Git Submodule** | Repository | Medium | ✅ Git-based | Shared code with tight coupling |

## Recommended Approach: NPM Package

Publishing to npm (public or private organization) is the most professional and scalable approach.

### Prerequisites
- npm account (free at https://www.npmjs.com)
- Authenticated locally: `npm login`
- Semantic versioning convention (major.minor.patch)

### Step-by-Step Setup

#### 1. Create Library Directory Structure
```
project-root/
├── packages/
│   ├── pdf-tool/                    # New library package
│   │   ├── src/
│   │   │   ├── PdfTool.ts          # Main class
│   │   │   └── index.ts            # Public exports
│   │   ├── dist/                   # Compiled output (generated)
│   │   ├── package.json            # Library-specific manifest
│   │   ├── tsconfig.json           # TypeScript config
│   │   ├── tsconfig.build.json     # Build config
│   │   ├── README.md               # Library documentation
│   │   └── .npmignore              # Files to exclude from npm
│   │
│   └── pdf-download/               # Existing project
│       └── (unchanged)
│
├── package.json                    # Root workspace config
└── tsconfig.json                   # Shared TypeScript config
```

#### 2. Create Root package.json (Monorepo with Workspaces)

**Root `package.json`:**
```json
{
  "name": "pdf-tools-workspace",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/pdf-tool",
    "packages/pdf-download"
  ],
  "scripts": {
    "build": "npm run build -w packages/pdf-tool",
    "publish:lib": "npm publish -w packages/pdf-tool",
    "test": "npm test -w packages/pdf-download"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

#### 3. Create Library package.json

**`packages/pdf-tool/package.json`:**
```json
{
  "name": "@your-org/pdf-tool",
  "version": "1.0.0",
  "description": "General-purpose PDF content verification library for QA automation",
  "license": "MIT",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/pdf-tools.git",
    "directory": "packages/pdf-tool"
  },
  "homepage": "https://github.com/your-org/pdf-tools/tree/main/packages/pdf-tool",
  "bugs": {
    "url": "https://github.com/your-org/pdf-tools/issues"
  },
  "keywords": [
    "pdf",
    "testing",
    "qa",
    "automation",
    "assertions",
    "verification"
  ],
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "build:watch": "tsc -p tsconfig.build.json --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "prepublishOnly": "npm run build",
    "version": "npm run build"
  },
  "dependencies": {},
  "peerDependencies": {
    "pdf-parse": "^1.5.0 || ^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

**Note:** Change `"access": "public"` to `"scoped": true` for private packages or remove if publishing unscoped.

#### 4. Create Public API Export

**`packages/pdf-tool/src/index.ts`:**
```typescript
/**
 * PdfTool - General-purpose PDF content verification library
 *
 * @example
 * ```typescript
 * import { PdfTool } from '@your-org/pdf-tool';
 *
 * const pdf = await PdfTool.fromBuffer(buffer);
 * await pdf.assertContains('Invoice');
 * await pdf.assertFieldEquals('Total', '1000');
 * ```
 */

export { PdfTool, PdfDocument } from './PdfTool';
export type {
  PdfToolOptions,
  PdfTextResult,
  DiffResult,
} from './PdfTool';
```

#### 5. TypeScript Build Configuration

**`packages/pdf-tool/tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**`packages/pdf-tool/tsconfig.build.json`:**
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["**/*.spec.ts", "**/*.test.ts"]
}
```

#### 6. Create .npmignore

**`packages/pdf-tool/.npmignore`:**
```
src/
*.spec.ts
*.test.ts
tsconfig.json
tsconfig.build.json
jest.config.js
.gitignore
.github/
CHANGELOG.md
```

#### 7. Create README for Library

**`packages/pdf-tool/README.md`:**
```markdown
# @your-org/pdf-tool

General-purpose PDF content verification library for QA automation in Playwright, Jest, and other testing frameworks.

## Installation

```bash
npm install @your-org/pdf-tool pdf-parse
```

## Quick Start

```typescript
import { PdfTool } from '@your-org/pdf-tool';

const response = await fetch('invoice.pdf');
const buffer = await response.arrayBuffer();

const pdf = await PdfTool.fromBuffer(new Uint8Array(buffer));

// Verify content
await pdf.assertContains('Invoice');
await pdf.assertFieldEquals('Total', 'USD 1,000');
await pdf.assertNumericFieldEquals('Amount', 1000, { tolerance: 0.01 });
```

## Features

- ✅ Unicode normalization
- ✅ Numeric comparison with tolerance
- ✅ Field extraction & validation
- ✅ Pattern matching (regex)
- ✅ Table extraction from PDFs
- ✅ Order-independent content checks
- ✅ Detailed error messages with diffs

## Documentation

See [LIBRARY_USAGE.md](./LIBRARY_USAGE.md) for comprehensive documentation and examples.
```

### Publishing Steps

#### 1. Build the Library
```bash
# From project root
npm run build -w packages/pdf-tool

# Or from library directory
cd packages/pdf-tool
npm run build
```

#### 2. Test Locally (Optional)
```bash
# From project root, link locally
npm link packages/pdf-tool

# In another project
npm link @your-org/pdf-tool

# Unlink when done
npm unlink @your-org/pdf-tool
```

#### 3. Update Version

```bash
cd packages/pdf-tool

# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major
```

#### 4. Publish to npm

```bash
# Ensure logged in
npm login

# Publish
cd packages/pdf-tool
npm publish

# For private org package
npm publish --access restricted
```

**Output:**
```
npm notice Publishing to registry with tag latest and default access
npm notice
+ @your-org/pdf-tool@1.0.0
```

### Using the Library in Other Projects

#### Installation

```bash
npm install @your-org/pdf-tool
```

#### Usage in Tests

```typescript
import { test, expect } from '@playwright/test';
import { PdfTool } from '@your-org/pdf-tool';

test('validate invoice PDF', async ({ request }) => {
  const response = await request.get('https://api.example.com/invoice.pdf');
  const buffer = await response.body();

  const pdf = await PdfTool.fromBuffer(buffer, {
    ignoreFields: ['Invoice Number', 'Date'],
    normalizeUnicode: true,
  });

  await pdf.assertContains('Company Name');
  await pdf.assertFieldEquals('Total', 'USD 5,000');
  await pdf.assertMatches(/Invoice #\d+/);
});
```

#### Usage in Node.js Scripts

```typescript
import fs from 'fs';
import { PdfTool } from '@your-org/pdf-tool';

const buffer = fs.readFileSync('document.pdf');
const pdf = await PdfTool.fromBuffer(new Uint8Array(buffer));

const lines = pdf.getLines();
console.log('Extracted content:', lines);

await pdf.assertContains('Expected Text');
```

## Alternative: GitHub Package Registry

For private packages within your organization:

### Setup

1. Create `.npmrc` in project root:
```
@your-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

2. Update library `package.json`:
```json
{
  "name": "@your-org/pdf-tool",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

3. Publish:
```bash
npm publish
```

### Installing from GitHub Registry

```json
{
  "dependencies": {
    "@your-org/pdf-tool": "^1.0.0"
  }
}
```

## Alternative: Monorepo Workspace (Single Repository)

If all projects are in the same repository:

### Root package.json
```json
{
  "private": true,
  "workspaces": [
    "packages/pdf-tool",
    "apps/*"
  ]
}
```

### Install Library in Another Package
```json
{
  "dependencies": {
    "@your-org/pdf-tool": "workspace:*"
  }
}
```

## Versioning & Changelog

### Semantic Versioning
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes

### Update Changelog

**`packages/pdf-tool/CHANGELOG.md`:**
```markdown
# Changelog

## [1.0.0] - 2024-03-24
### Added
- Unicode normalization for special characters
- Numeric field comparison with tolerance
- Table extraction from PDFs
- Order-independent content verification

### Changed
- Enhanced error messages with diffs

### Fixed
- Better regex escaping for field names
```

## Continuous Integration / Automated Publishing

### GitHub Actions Example

**`.github/workflows/publish-pdf-tool.yml`:**
```yaml
name: Publish PDF Tool Library

on:
  push:
    tags:
      - 'pdf-tool-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      
      - run: npm run build -w packages/pdf-tool
      
      - run: npm publish -w packages/pdf-tool
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Maintenance & Support

### When Publishing Updates

1. **Update code** in `packages/pdf-tool/src/`
2. **Run tests**: `npm test -w packages/pdf-tool`
3. **Build**: `npm run build -w packages/pdf-tool`
4. **Update version**: `npm version patch|minor|major`
5. **Publish**: `npm publish -w packages/pdf-tool`
6. **Update CHANGELOG.md** with changes

### Deprecation Policy

```bash
# Deprecate old version
npm deprecate @your-org/pdf-tool@0.1.0 "Use 1.0.0+ instead"

# Undeprecate if needed
npm undeprecate @your-org/pdf-tool@0.1.0
```

## Support & Issues

- Create GitHub issues for bug reports
- Include PDF sample (obfuscated if needed)
- Provide minimal reproduction test case
- Document expected vs actual behavior

## License

MIT - See LICENSE file for details
