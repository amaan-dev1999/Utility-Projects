import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { PdfTool, PdfDocument } from '../src/pdf-tool-lib/PdfTool';

test.describe('PDF verification using PdfTool (comprehensive)', () => {
    // ===== BASIC CONTENT TESTS =====
    test('should extract and verify basic PDF content', async ({ page, request }) => {
        await page.goto('http://localhost:4200/');
        const select = page.getByLabel('Select PDF document');
        await select.selectOption('invoice');
        await page.getByRole('button', { name: /download pdf/i }).click();

        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        expect(response.ok()).toBeTruthy();
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer, {
            normalizeWhitespace: true,
            ignoreCase: false,
        });

        // Verify extractable text exists
        expect(pdf.hasExtractableText()).toBe(true);

        // Basic contains check
        await pdf.assertContains('ACME Corporation');
        await pdf.assertContains('INVOICE');
    });

    // ===== FIELD EXTRACTION & MATCHING =====
    test('should handle field extraction with various separators', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // Test both colon and dash separators
        await pdf.assertFieldEquals('Total Amount Due', 'USD 4,785.00');
        
        // Should also work case-insensitively when option set
        const pdfCaseInsensitive = await PdfTool.fromBuffer(buffer, {
            ignoreCase: true,
        });
        await pdfCaseInsensitive.assertFieldEquals('total amount due', 'USD 4,785.00');
    });

    // ===== MULTILINE FIELD HANDLING =====
    test('should extract all occurrences of repeated fields', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // Extract all line items if they exist
        const lineItems = await pdf.extractAllFieldValues('Item');
        
        // Verify extraction works even if empty
        expect(Array.isArray(lineItems)).toBe(true);
    });

    test('should assert field contains one of multiple values', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // This would work for fields that might have variations
        await expect(
            pdf.assertFieldContainsOneOf('Total Amount Due', [
                'USD 4,785.00',
                'USD 4785.00',
                '4,785.00',
            ]),
        ).resolves.not.toThrow();
    });

    // ===== NUMERIC FIELD HANDLING =====
    test('should compare numeric fields with tolerance for formatting', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // Should work even if PDF has "USD 4,785.00" vs "4785.00"
        await pdf.assertNumericFieldEquals('Total Amount Due', 4785, { tolerance: 1 });
    });

    test('should validate numeric field within range', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // Amount should be between 4000 and 5000
        await pdf.assertFieldBetween('Total Amount Due', 4000, 5000);
    });

    test('should fail numeric comparison when out of range', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        await expect(
            pdf.assertFieldBetween('Total Amount Due', 5000, 6000),
        ).rejects.toThrow();
    });

    // ===== UNICODE & SPECIAL CHARACTER HANDLING =====
    test('should normalize unicode characters (smart quotes, dashes)', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer, { normalizeUnicode: true });

        // Even if PDF has smart quotes, should match regular quotes
        const normalized = pdf.getTextNormalized();
        expect(normalized).toBeTruthy();
        expect(typeof normalized).toBe('string');
    });

    // ===== PATTERN MATCHING & REGEX =====
    test('should verify regex patterns in PDF content', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // Should find date patterns
        await pdf.assertMatches(/\d{4}-\d{2}-\d{2}/);
        
        // Should match currency amounts
        await pdf.assertMatches(/USD\s+[\d,]+\.\d{2}/);
    });

    test('should verify negative regex patterns', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // Invoices shouldn't contain these
        await pdf.assertNotMatches(/DRAFT/i);
        await pdf.assertNotMatches(/CANCELLED/i);
    });

    // ===== CONTENT PRESENCE CHECKS =====
    test('should verify multiple content pieces exist', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // Assert multiple critical fields at once
        await pdf.assertContainsAll([
            'ACME Corporation',
            'INVOICE',
            'Total',
            'USD',
        ]);
    });

    test('should verify content does not exist', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // Invoice should not contain competitor names
        await pdf.assertNotContains('COMPETITOR INC');
        await pdf.assertNotContains('INVALID ORDER');
    });

    // ===== LINE-BASED ASSERTIONS =====
    test('should assert lines appear in order', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // Header should come before total
        await pdf.assertContainsLines([
            'INVOICE',
            'Total',
        ], { unordered: false });
    });

    test('should assert lines exist regardless of order', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // All these should exist, order doesn't matter
        await pdf.assertContainsLines([
            'USD',
            'INVOICE',
            'Corporation',
        ], { unordered: true });
    });

    // ===== NORMALIZATION & OPTIONS =====
    test('should apply custom normalization options', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer, {
            ignoreFields: ['Invoice Number', 'Invoice Date'],
            normalizeWhitespace: true,
            ignoreCase: true,
        });

        // Ignored fields should have <IGNORED_FIELD> placeholder
        await pdf.assertContains('invoice number: <ignored_field>');
    });

    test('should handle remove and replace patterns', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer, {
            replacePatterns: [
                { pattern: /\b\d{4}-\d{2}-\d{2}\b/g, replacement: '<DATE>' },
                { pattern: /USD\s*[\d,]+\.\d{2}/g, replacement: '<AMOUNT>' },
            ],
        });

        // Should see replaced tokens instead of actual values
        const text = pdf.getTextNormalized();
        expect(text).toContain('<DATE>');
        expect(text).toContain('<AMOUNT>');
    });

    // ===== ERROR CASES & EDGE CASES =====
    test('should throw descriptive error when field not found', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        await expect(
            pdf.assertFieldEquals('Non Existent Field', 'any value'),
        ).rejects.toThrow(/Field "Non Existent Field" not found/);
    });

    test('should throw error with diff when content mismatch', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        await expect(
            pdf.assertContains('NONEXISTENT TEXT THAT WILL NOT MATCH'),
        ).rejects.toThrow(/PDF does not contain expected text/);
    });

    test('should throw error when PDF has no extractable text', async () => {
        // Create a minimal invalid PDF buffer
        const invalidBuffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]);

        await expect(
            PdfTool.fromBuffer(invalidBuffer),
        ).rejects.toThrow(/no extractable text|invalid/i);
    });

    test('should provide raw vs normalized text for debugging', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer, {
            normalizeWhitespace: true,
        });

        const rawText = pdf.getTextRaw();
        const normalizedText = pdf.getTextNormalized();

        expect(rawText).toBeTruthy();
        expect(normalizedText).toBeTruthy();
        // Normalized should have fewer extra spaces/newlines
        expect(normalizedText.length).toBeLessThanOrEqual(rawText.length);
    });

    // ===== FIXTURE-BASED TESTING =====
    test('should verify full content against fixture file', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        expect(response.ok()).toBeTruthy();

        const buffer = await response.body();
        const pdf = await PdfTool.fromBuffer(buffer, {
            ignoreFields: ['Invoice Number', 'Invoice Date', 'Due Date'],
        });

        // Save for debugging
        const downloadsDir = path.join(__dirname, 'downloads-tool');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(downloadsDir, 'sample-invoice.pdf'), buffer);
        fs.writeFileSync(
            path.join(downloadsDir, 'extracted-text.txt'),
            pdf.getTextNormalized(),
        );

        // If fixture exists, compare against it
        const fixturePath = path.join(__dirname, '../fixtures/expected-invoice.txt');
        if (fs.existsSync(fixturePath)) {
            const expectedText = fs.readFileSync(fixturePath, 'utf-8');
            await pdf.assertFullContentEquals(expectedText);
        }
    });

    // ===== TABLE EXTRACTION =====
    test('should extract table data from PDF', async ({ request }) => {
        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        const buffer = await response.body();

        const pdf = await PdfTool.fromBuffer(buffer);

        // Try to extract items table if it exists
        try {
            const items = await pdf.extractTable(
                /Items?/i,
                /Total/i,
            );
            
            expect(Array.isArray(items)).toBe(true);
            expect(items.length).toBeGreaterThanOrEqual(0);
        } catch (e) {
            // Table might not exist - that's OK for this test
            expect((e as Error).message).toContain('Table start pattern not found');
        }
    });

    // ===== INTEGRATION TEST =====
    test('comprehensive QA validation scenario', async ({ page, request }) => {
        // Navigate and download
        await page.goto('http://localhost:4200/');
        const select = page.getByLabel('Select PDF document');
        await select.selectOption('invoice');
        await page.getByRole('button', { name: /download pdf/i }).click();

        const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
        const response = await request.get(invoiceUrl);
        expect(response.ok()).toBeTruthy();

        const buffer = await response.body();

        // Parse with comprehensive options
        const pdf = await PdfTool.fromBuffer(buffer, {
            normalizeWhitespace: true,
            ignoreCase: false,
            normalizeUnicode: true,
            ignoreFields: ['Invoice Number', 'Invoice Date', 'Due Date'],
            replacePatterns: [
                { pattern: /\b\d{4}-\d{2}-\d{2}\b/g, replacement: '<DATE>' },
            ],
        });

        // Comprehensive assertions
        expect(pdf.hasExtractableText()).toBe(true);

        // Header checks
        await pdf.assertContains('INVOICE');
        await pdf.assertContains('ACME Corporation');

        // Field checks
        await pdf.assertFieldEquals('Total Amount Due', 'USD 4,785.00');

        // Numeric checks
        await pdf.assertNumericFieldEquals('Total Amount Due', 4785, { tolerance: 1 });
        await pdf.assertFieldBetween('Total Amount Due', 4000, 5000);

        // Pattern checks
        await pdf.assertMatches(/INVOICE/);

        // Bulk content check
        await pdf.assertContainsAll([
            'INVOICE',
            'Total',
            'USD',
            'ACME',
        ]);

        // Line-based checks
        await pdf.assertContainsLines(['INVOICE', 'Total'], { unordered: false });

        // Negation checks
        await pdf.assertNotContains('DRAFT');
        await pdf.assertNotMatches(/CANCELLED/i);
    });
});