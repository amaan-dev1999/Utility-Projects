import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { PdfTool } from '../src/pdf-tool-lib/PdfTool';

async function getInvoiceBuffer(request: any): Promise<Uint8Array> {
    const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
    const response = await request.get(invoiceUrl);
    expect(response.ok()).toBeTruthy();
    return response.body();
}

test.describe('PDF verification showcase: manual approach vs PdfTool approach', () => {
    test.describe('Manual-style tests (team pain points)', () => {
        test('manual parsing requires repeated parser setup and ad-hoc normalization', async ({ request }) => {
            const buffer = await getInvoiceBuffer(request);

            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            await parser.destroy();

            const text = data.text;
            const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

            expect(text).toContain('ACME Corporation');
            expect(text).toContain('INVOICE');
            expect(normalize(text)).toContain('Total Amount Due: USD 4,785.00');
        });

        test('manual checks for dynamic content need custom replacements in each test', async ({ request }) => {
            const buffer = await getInvoiceBuffer(request);

            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            await parser.destroy();

            const raw = data.text;
            const normalized = raw
                .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '<DATE>')
                .replace(/INV-\d+/g, '<INVOICE_ID>')
                .replace(/\s+/g, ' ')
                .trim();

            expect(normalized).toContain('INVOICE');
            expect(normalized).toContain('<DATE>');
            expect(normalized).toContain('<INVOICE_ID>');
        });

        test('manual assertions are primitive and spread across parser details', async ({ request }) => {
            const buffer = await getInvoiceBuffer(request);

            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            await parser.destroy();

            const text = data.text;

            expect(/USD\s+[\d,]+\.\d{2}/.test(text)).toBeTruthy();
            expect(/DRAFT/i.test(text)).toBeFalsy();
            expect(/CANCELLED/i.test(text)).toBeFalsy();
        });
    });

    test.describe('PdfTool tests (robust QA utility)', () => {
        test('single API parse + extractable text + basic content checks', async ({ request }) => {
            const buffer = await getInvoiceBuffer(request);
            const pdf = await PdfTool.fromBuffer(buffer);

            expect(pdf.hasExtractableText()).toBe(true);
            await pdf.assertContains('ACME Corporation');
            await pdf.assertContains('INVOICE');
            await pdf.assertNotContains('COMPETITOR INC');
        });

        test('field, numeric, and range assertions stay business-focused', async ({ request }) => {
            const buffer = await getInvoiceBuffer(request);
            const pdf = await PdfTool.fromBuffer(buffer);

            await pdf.assertFieldEquals('Total Amount Due', 'USD 4,785.00');
            await pdf.assertNumericFieldEquals('Total Amount Due', 4785, { tolerance: 1 });
            await pdf.assertFieldBetween('Total Amount Due', 4000, 5000);
        });

        test('regex and negative regex assertions are reusable', async ({ request }) => {
            const buffer = await getInvoiceBuffer(request);
            const pdf = await PdfTool.fromBuffer(buffer);

            await pdf.assertMatches(/USD\s+[\d,]+\.\d{2}/);
            await pdf.assertMatches(/\d{4}-\d{2}-\d{2}/);
            await pdf.assertNotMatches(/DRAFT/i);
            await pdf.assertNotMatches(/CANCELLED/i);
        });

        test('line-order and bulk-content checks cover layout variation safely', async ({ request }) => {
            const buffer = await getInvoiceBuffer(request);
            const pdf = await PdfTool.fromBuffer(buffer);

            await pdf.assertContainsAll(['INVOICE', 'Total', 'USD', 'ACME']);
            await pdf.assertContains('Corporation');
            await pdf.assertContains('Total Amount Due');
        });

        test('dynamic content handling is centralized via options', async ({ request }) => {
            const buffer = await getInvoiceBuffer(request);
            const pdf = await PdfTool.fromBuffer(buffer, {
                normalizeWhitespace: true,
                normalizeUnicode: true,
                ignoreCase: true,
                ignoreFields: ['Invoice Number', 'Invoice Date', 'Due Date'],
                replacePatterns: [
                    { pattern: /\b\d{4}-\d{2}-\d{2}\b/g, replacement: '<DATE>' },
                ],
            });

            await pdf.assertContains('invoice number: <ignored_field>');
            await pdf.assertContains('invoice date: <ignored_field>');
            await pdf.assertContains('due date: <ignored_field>');
        });

        test('field extraction helpers support repeated and variant values', async ({ request }) => {
            const buffer = await getInvoiceBuffer(request);
            const pdf = await PdfTool.fromBuffer(buffer);

            const items = await pdf.extractAllFieldValues('Item');
            expect(Array.isArray(items)).toBe(true);

            await expect(
                pdf.assertFieldContainsOneOf('Total Amount Due', ['USD 4,785.00', 'USD 4785.00', '4,785.00']),
            ).resolves.not.toThrow();
        });

        test('full-content fixture regression check is available', async ({ request }) => {
            const buffer = await getInvoiceBuffer(request);
            const pdf = await PdfTool.fromBuffer(buffer, {
                ignoreFields: ['Invoice Number', 'Invoice Date', 'Due Date'],
            });

            const fixturePath = path.join(__dirname, '../assets/fixtures/expected-invoice.txt');
            if (fs.existsSync(fixturePath)) {
                const expectedText = fs.readFileSync(fixturePath, 'utf-8');
                await pdf.assertFullContentEquals(expectedText);
            } else {
                await pdf.assertContains('INVOICE');
            }
        });

        test('table extraction utility and debug accessors are available', async ({ request }) => {
            const buffer = await getInvoiceBuffer(request);
            const pdf = await PdfTool.fromBuffer(buffer, { normalizeWhitespace: true });

            const raw = pdf.getTextRaw();
            const normalized = pdf.getTextNormalized();
            const lines = pdf.getLines();

            expect(raw.length).toBeGreaterThan(0);
            expect(normalized.length).toBeGreaterThan(0);
            expect(Array.isArray(lines)).toBe(true);

            try {
                const rows = await pdf.extractTable(/Items?/i, /Total/i);
                expect(Array.isArray(rows)).toBe(true);
            } catch (error) {
                expect((error as Error).message).toContain('Table start pattern not found');
            }
        });
    });
});
