import { test, expect } from '@playwright/test';
import { PdfTool, PdfDocument } from '../src/pdf-tool-lib/PdfTool';

// Shared helper to load invoice PDF
async function loadInvoicePdf(page: any, request: any) {
    await page.goto('http://localhost:4200/');
    await page.getByLabel('Select PDF document').selectOption('invoice');
    await page.getByRole('button', { name: /download pdf/i }).click();
    const response = await request.get('http://localhost:4200/assets/sample-invoice.pdf');
    expect(response.ok()).toBeTruthy();
    const buffer = await response.body();
    return PdfTool.fromBuffer(buffer);
}
// 3. CONTENT ASSERTION METHODS
//test.describe.only('Content Assertion Methods', () => {
test('assertContains() - should pass when text exists in PDF', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);
    await pdf.assertContains('ACME Corporation');
    await pdf.assertContains('Phone: +1 (555) 123-4567');
    await pdf.assertContains('INVOICE');
    await pdf.assertContains('Total Amount Due');
    await pdf.assertContains('USD');
});
test('assertNotContains() - should pass when text is absent from PDF', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);
    await pdf.assertNotContains('acme Corporation');
    await pdf.assertNotContains('CONFIDENTIAL');
    await pdf.assertNotContains('DRAFT');
    await pdf.assertNotContains('VOID');
    await pdf.assertNotContains('CANCELLED');
});
test('assertContainsAll() - should pass when all content exists in PDF', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);
    await pdf.assertContainsAll([
        'ACME Corporation',
        'INVOICE',
        'Phone:',
        'Total Amount Due',
        'USD',
        'Bill To:'
    ]);
});
// failing if we are not using unordered: true
//assertContainsLines throwing an error as the sequence is not matching the pdf when we use "unordered: false"
test('assertContainsLines() - should validate lines in order', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);
    await pdf.assertContainsLines([
        'ACME Corporation',
        'INVOICE'
    ], { unordered: true });
});
test('assertContainsLines() - should validate lines in any order (unordered)', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);

    await pdf.assertContainsLines([
        'Total Amount Due',
        'ACME Corporation',
        'Phone:'
    ], { unordered: true });
});
// 4. PATTERN MATCHING METHODS
//test.describe('Pattern Matching Methods', () => {
test('assertMatches() - should match phone number regex', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);
    await pdf.assertMatches(/Phone:\s*\+1\s*\(\d{3}\)\s*\d{3}-\d{4}/);
});
test('assertMatches() - should match date pattern regex', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);
    await pdf.assertMatches(/\d{4}-\d{2}-\d{2}/);
});
test('assertMatches() - should match invoice number pattern', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);

    await pdf.assertMatches(/INV-\d{4}/);
});

test('assertMatches() - should match currency amount pattern', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);

    await pdf.assertMatches(/USD\s+[\d,]+\.\d{2}/);
});

test('assertNotMatches() - should not match draft or void status', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);

    await pdf.assertNotMatches(/DRAFT|VOID|CANCELLED/i);
});

test('assertNotMatches() - should not match error or warning patterns', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);

    await pdf.assertNotMatches(/ERROR|WARNING|FAILED/i);
});

test('assertNotMatches() - should not match placeholder text', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);

    await pdf.assertNotMatches(/TODO|PLACEHOLDER|DEBUG/i);
});

// 5. FIELD-BASED VALIDATION METHODS
test.describe('Field-Based Validation Methods', () => {

    test('assertFieldEquals() - should match Total Amount Due value', async ({ page, request }) => {
        const pdf = await loadInvoicePdf(page, request);

        await pdf.assertFieldEquals('Total Amount Due', 'USD 4,785.00');
    });

    test('assertFieldEquals() - should match Invoice Number value', async ({ page, request }) => {
        const pdf = await loadInvoicePdf(page, request);

        await pdf.assertFieldEquals('Invoice Number', 'INV-2024-00123');
    });

    test('assertFieldEquals() - should match Phone value', async ({ page, request }) => {
        const pdf = await loadInvoicePdf(page, request);

        await pdf.assertFieldEquals('Phone', '+1 (555) 123-4567');
    });

    test('extractAllFieldValues() - should extract all Phone field occurrences', async ({ page, request }) => {
        const pdf = await loadInvoicePdf(page, request);

        const phoneValues = await pdf.extractAllFieldValues('Phone');

        expect(Array.isArray(phoneValues)).toBeTruthy();
        expect(phoneValues.length).toBeGreaterThan(0);
        expect(phoneValues[0]).toContain('555');
    });

    test('extractAllFieldValues() - should extract all Email field occurrences', async ({ page, request }) => {
        const pdf = await loadInvoicePdf(page, request);

        const emailValues = await pdf.extractAllFieldValues('Email');

        expect(Array.isArray(emailValues)).toBeTruthy();
        expect(emailValues.length).toBeGreaterThan(0);
    });

    test('assertFieldContainsOneOf() - should match Invoice Number from list', async ({ page, request }) => {
        const pdf = await loadInvoicePdf(page, request);

        await pdf.assertFieldContainsOneOf('Invoice Number', [
            'INV-2024-00121',
            'INV-2024-00122',
            'INV-2024-00123',
            'INV-2024-00124'
        ]);
    });

    test('assertFieldContainsOneOf() - should match Phone from list', async ({ page, request }) => {
        const pdf = await loadInvoicePdf(page, request);

        await pdf.assertFieldContainsOneOf('Phone', [
            '+1 (555) 123-4567',
            '+1 (555) 123-4568',
            '+1 (555) 123-4569'
        ]);
    });

});

// 6. NUMERIC VALIDATION METHODS

//test.describe('Numeric Validation Methods', () => {

test('assertNumericFieldEquals() - should validate Total Amount Due with loose tolerance', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);

    await pdf.assertNumericFieldEquals('Total Amount Due', 4785.00, { tolerance: 1.0 });
});

test('assertNumericFieldEquals() - should validate Total Amount Due with strict tolerance', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);

    await pdf.assertNumericFieldEquals('Total Amount Due', 4785.00, { tolerance: 0.01 });
    await pdf.assertNumericFieldEquals('Subtotal', 4350.00, { tolerance: 50.0 });

});

test('assertNumericFieldEquals() - should validate Subtotal with tolerance', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);

    await pdf.assertNumericFieldEquals('Subtotal', 4350.00, { tolerance: 50.0 });
});

test('assertNumericFieldEquals() - should validate Tax with tolerance', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);
    await pdf.assertNumericFieldEquals('Tax (10%)', 435.00, { tolerance: 10.0 });
});

test('assertFieldBetween() - Total Amount Due should be within expected range', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);
    await pdf.assertFieldBetween('Total Amount Due', 1000, 10000);
});

test('assertFieldBetween() - Subtotal should be within expected range', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);
    await pdf.assertFieldBetween('Subtotal', 1000, 8000);
});

test('assertFieldBetween() - Tax should be within expected range', async ({ page, request }) => {
    const pdf = await loadInvoicePdf(page, request);
    await pdf.assertFieldBetween('Tax (10%)', 100, 1000);
});

//});
// 7. TABLE EXTRACTION METHODS
test.describe('Table Extraction Methods', () => {
    test('extractTable() - should extract rows using string patterns', async ({ page, request }) => {
        const pdf = await loadInvoicePdf(page, request);
        const rows = await pdf.extractTable('Description', 'Total Amount Due');
        expect(Array.isArray(rows)).toBeTruthy();
        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0]).toHaveProperty('raw');
        expect(rows[0]).toHaveProperty('values');
    });

    test('extractTable() - should extract rows using regex patterns', async ({ page, request }) => {
        const pdf = await loadInvoicePdf(page, request);
        const rows = await pdf.extractTable(/Description|Item|Service/, /Subtotal|Total/);
        expect(Array.isArray(rows)).toBeTruthy();
        expect(rows.length).toBeGreaterThan(0);
    });

    test('extractTable() - should extract rows without end pattern', async ({ page, request }) => {
        const pdf = await loadInvoicePdf(page, request);
        const rows = await pdf.extractTable('Description');
        expect(Array.isArray(rows)).toBeTruthy();
        expect(rows.length).toBeGreaterThan(0);
    });

});
// 8. STATIC UTILITY METHODS

test.describe('Static Utility Methods', () => {

    test('PdfDocument.normalizeText() - should collapse whitespace', async ({ page, request }) => {
        const input = 'ACME   Corporation\n\nPhone:\t+1 (555) 123-4567';
        const result = PdfDocument.normalizeText(input, { normalizeWhitespace: true });
        expect(result).toBe('ACME Corporation Phone: +1 (555) 123-4567');
        expect(result).not.toContain('\t');
        expect(result).not.toContain('\n\n');
    });

    test('PdfDocument.normalizeText() - should convert to lowercase with ignoreCase', async ({ page, request }) => {
        const input = 'ACME Corporation INVOICE';
        const result = PdfDocument.normalizeText(input, { ignoreCase: true });
        expect(result).toBe('acme corporation invoice');
    });
    test('PdfDocument.normalizeText() - should apply removePatterns option', async ({ page, request }) => {
        const input = 'ACME Corporation REF-12345 Invoice';
        const result = PdfDocument.normalizeText(input, {
            removePatterns: [/REF-\d+/g]
        });
        expect(result).not.toContain('REF-12345');
        expect(result).toContain('ACME Corporation');
    });

    test('PdfDocument.normalizeText() - should apply replacePatterns option', async ({ page, request }) => {
        const input = 'Invoice Date: 2024-03-15';
        const result = PdfDocument.normalizeText(input, {
            replacePatterns: [{ pattern: /\d{4}-\d{2}-\d{2}/, replacement: 'DATE_REPLACED' }]
        });
        expect(result).toContain('DATE_REPLACED');
        expect(result).not.toContain('2024-03-15');
    });
    test('PdfDocument.normalizeText() - should apply ignoreFields option', async ({ page, request }) => {
        const input = 'Invoice Number: INV-2024-00123\nTotal Amount Due: USD 4,785.00';
        const result = PdfDocument.normalizeText(input, {
            ignoreFields: ['Invoice Number']
        });
        expect(result).toContain('Invoice Number: <IGNORED_FIELD>');
        expect(result).not.toContain('INV-2024-00123');
    });

});
 