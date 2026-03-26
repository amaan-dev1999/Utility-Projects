import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse'; 

test.describe('PDF manual verification demo', () => {
  test('QA-style manual checks for invoice PDF (no reusable tool)', async ({ page, request }) => {

    await page.goto('http://localhost:4200/');

    const select = page.getByLabel('Select PDF document');
    await select.selectOption('invoice');

    await page.getByRole('button', { name: /download pdf/i }).click();

    const invoiceUrl = 'http://localhost:4200/assets/sample-invoice.pdf';
    const response = await request.get(invoiceUrl);
    expect(response.ok()).toBeTruthy();

    const buffer = await response.body();

    const downloadsDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    const filePath = path.join(downloadsDir, 'sample-invoice.pdf');
    fs.writeFileSync(filePath, buffer);
//---------------------------------------------------------//
    const parser = new PDFParse({ data: buffer });

    const data = await parser.getText();
    await parser.destroy();

    const text = data.text;

    expect(text).toContain('ACME Corporation');
    expect(text).toContain('INVOICE');
    expect(text).toContain('Invoice Number: INV-2024-00123');
    const normalize = (s: string) =>
    s.replace(/\s+/g, ' ').trim();
    expect(normalize(text)).toContain('Total Amount Due: USD 4,785.00');
    // expect(text).toContain('Total Amount Due: USD     4785.00');
  });
});