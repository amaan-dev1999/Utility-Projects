import { test, expect } from '@playwright/test';
import { PdfTool, PdfDocument } from '../src/pdf-tool-lib/PdfTool';



// Shared helper to load quarterly report PDF
//→ Returns PdfDocument instance
async function loadQuarterlyReportPdf(page: any, request: any): Promise<PdfDocument> {
    await page.goto('http://localhost:4200/');
    await page.getByLabel('Select PDF document').selectOption('report'); // Assuming 'report' is the option value
    await page.getByRole('button', { name: /download pdf/i }).click();

    const response = await request.get('http://localhost:4200/assets/sample-report.pdf'); // Assuming this is the URL
    expect(response.ok()).toBeTruthy();    // PDF download was successful

    const buffer = await response.body();  //get the raw PDF binary data from the response & buffer contains: The actual PDF file bytes
    return PdfTool.fromBuffer(buffer);
    /*
    buffer = Raw PDF file (unreadable)
    PdfTool.fromBuffer(buffer) = Convert to readable + usable PDF
    return = Give the usable PDF back to whoever asked for it
    */
}




test.describe('Quarterly Report Template Verification', () => {

    // ==========================================
    // 1. DOCUMENT HEADER & METADATA VERIFICATION
    // ==========================================

    test.describe('1. Document Header & Metadata Verification', () => {
        +
            test('should verify company branding and document identity', async ({ page, request }) => {
                const pdf = await loadQuarterlyReportPdf(page, request);
                //const pdf = ... → Stores the PdfDocument object

                // Company branding verification
                await pdf.assertContains('ACME Corporation');
                await pdf.assertContains('Quarterly Performance Report');

                // Document metadata structure
                await pdf.assertMatches(/Q\d{1} \d{4}/); // Quarter pattern (Q1 2024)
                // await pdf.assertMatches(/Date: \d{4}-\d{2}-\d{2}/); // Date format (Date: 2024-04-05)
            });

        test('should have content in correct sequence', async ({ page, request }) => {
            const pdf = await loadQuarterlyReportPdf(page, request);
            const rawText = pdf.getTextRaw();  // ← Fixed indentation
            const normalizedText = pdf.getTextNormalized(); // ← Fixed indentation

            // Sequence verification
            await pdf.assertContainsLines([                           // ← Fixed indentation
                'ACME Corporation',
                'Quarterly Performance Report',
                'Q1 2024',
                // ← Added if needed
            ], {
                unordered: false
            });
        });

        test('Basic assertFullContentEquals - Success Case', async ({ page, request }) => {
            const pdf = await loadQuarterlyReportPdf(page, request);



            const expectedResponse = await request.get('http://localhost:4200/assets/sample-report.pdf');
            expect(expectedResponse.ok()).toBeTruthy();
            const expectedBuffer = await expectedResponse.body();
            const expectedPdf = await PdfTool.fromBuffer(expectedBuffer);
            const expectedContent = expectedPdf.getTextRaw();

            await pdf.assertFullContentEquals(expectedContent);

        });

        test('should fail with empty expected content', async ({ page, request }) => {
            const pdf = await loadQuarterlyReportPdf(page, request);

            await expect(async () => {
                await pdf.assertFullContentEquals(''); // Empty string
            }).rejects.toThrow('PDF full content does not match expected content');
        });

    });

});
