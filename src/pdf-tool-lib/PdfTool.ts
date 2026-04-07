import { PDFParse } from 'pdf-parse';

export interface PdfToolOptions {
    normalizeWhitespace?: boolean;
    ignoreCase?: boolean;
    normalizeUnicode?: boolean;
    removePatterns?: RegExp[];
    replacePatterns?: { pattern: RegExp; replacement: string }[];
    ignoreFields?: string[];
    multilineFields?: boolean;
}

export interface PdfTextResult {
    rawText: string;
    normalizedText: string;
}

export interface DiffResult {
    expected: string;
    actual: string;
    contextBefore?: string;
    contextAfter?: string;
}

/**
 * Represents one parsed PDF document and exposes assertion helpers.
 */
export class PdfDocument {
    private rawText: string;
    private normalizedText: string;
    private baseOptions: PdfToolOptions;
    private lines: string[];

    constructor(rawText: string, options: PdfToolOptions = {}) {
        this.baseOptions = {
            normalizeWhitespace: true,
            ignoreCase: false,
            normalizeUnicode: true,
            multilineFields: false,
            removePatterns: [],
            ...options,
        };
        this.rawText = rawText;
        this.normalizedText = PdfDocument.normalizeText(rawText, this.baseOptions);
        this.lines = this.normalizedText.split('\n').filter(line => line.trim());
    }

    /** Normalize Unicode characters (smart quotes, dashes, ligatures) */
    private static normalizeUnicodeChars(text: string): string {
        return text
            .replace(/[\u201C\u201D]/g, '"') // smart quotes → regular quotes
            .replace(/[\u2018\u2019]/g, "'") // smart single quotes → apostrophe
            .replace(/[\u2013\u2014]/g, '-') // en-dash, em-dash → hyphen
            .replace(/\u00AD/g, '') // soft hyphen
            .replace(/\ufb00/g, 'ff') // ligature fi → fi
            .replace(/\ufb01/g, 'fi') // ligature fl → fl
            .replace(/\u2009/g, ' '); // thin space → regular space
    }

    /** Create diff context for error messages */
    private static createDiffContext(
        expected: string,
        actual: string,
        contextLines: number = 2,
    ): string {
        const expectedLines = expected.split('\n');
        const actualLines = actual.split('\n');
        
        let diffOutput = '\n--- Expected ---\n';
        diffOutput += expectedLines.slice(0, Math.min(5, expectedLines.length)).join('\n');
        if (expectedLines.length > 5) diffOutput += `\n... (${expectedLines.length - 5} more lines)`;
        
        diffOutput += '\n\n--- Actual ---\n';
        diffOutput += actualLines.slice(0, Math.min(5, actualLines.length)).join('\n');
        if (actualLines.length > 5) diffOutput += `\n... (${actualLines.length - 5} more lines)`;
        
        return diffOutput;
    }

    /** Core normalization logic used everywhere */
    static normalizeText(text: string, options: PdfToolOptions): string {
        let result = text;

        // Unicode normalization first
        if (options.normalizeUnicode !== false) {
            result = PdfDocument.normalizeUnicodeChars(result);
        }

        if (options.ignoreFields?.length) {
            const flags = options.ignoreCase ? 'gi' : 'g';
            for (const label of options.ignoreFields) {
                const pattern = new RegExp(
                    `${escapeRegExp(label)}\\s*[:\\-]\\s*.+?(?:\\n|$)`,
                    flags,
                );
                result = result.replace(
                    pattern,
                    `${label}: <IGNORED_FIELD>\n`,
                );
            }
        }

        if (options.removePatterns) {
            for (const p of options.removePatterns) result = result.replace(p, '');
        }
        if (options.replacePatterns) {
            for (const { pattern, replacement } of options.replacePatterns) {
                result = result.replace(pattern, replacement);
            }
        }
        if (options.normalizeWhitespace !== false) {
            result = result.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
        }
        if (options.ignoreCase) result = result.toLowerCase();
        return result;
    }
    
    /** Get raw extracted text (no normalization). Useful for debugging. */
    getTextRaw(): string {
        return this.rawText;
    }

    /** Get normalized text with baseOptions applied. */
    getTextNormalized(): string {
        return this.normalizedText;
    }

    /** Get all lines from normalized text */
    getLines(): string[] {
        return [...this.lines];
    }

    /** Check if PDF has extractable text (not image-only) */
    hasExtractableText(): boolean {
        return this.rawText.trim().length > 0;
    }

    /** Assert full content equality with detailed diff on failure */
    async assertFullContentEquals(expected: string, options: PdfToolOptions = {}) {
        const mergedOptions: PdfToolOptions = { ...this.baseOptions, ...options };
        const actual = PdfDocument.normalizeText(this.rawText, mergedOptions);
        const expectedNorm = PdfDocument.normalizeText(expected, mergedOptions);

        if (actual !== expectedNorm) {
            const diff = PdfDocument.createDiffContext(expectedNorm, actual);
            throw new Error(`PDF full content does not match expected content.${diff}`);
        }
    }

    /** Assert that a substring exists in the PDF text */
    async assertContains(expectedSubstring: string, options: PdfToolOptions = {}) {
        const mergedOptions: PdfToolOptions = { ...this.baseOptions, ...options };
        const haystack = PdfDocument.normalizeText(this.rawText, mergedOptions);
        const needle = PdfDocument.normalizeText(expectedSubstring, mergedOptions);

        if (!haystack.includes(needle)) {
            throw new Error(
                `PDF does not contain expected text: "${expectedSubstring}".\n\nSearched in:\n${haystack.substring(0, 500)}${haystack.length > 500 ? '...' : ''}`,
            );
        }
    }

    /** Assert that PDF does NOT contain a substring */
    async assertNotContains(unexpectedSubstring: string, options: PdfToolOptions = {}) {
        const mergedOptions: PdfToolOptions = { ...this.baseOptions, ...options };
        const haystack = PdfDocument.normalizeText(this.rawText, mergedOptions);
        const needle = PdfDocument.normalizeText(unexpectedSubstring, mergedOptions);

        if (haystack.includes(needle)) {
            throw new Error(
                `PDF unexpectedly contains text: "${unexpectedSubstring}".`,
            );
        }
    }

    /** Assert PDF text matches a regex */
    async assertMatches(regex: RegExp) {
        if (!regex.test(this.rawText)) {
            throw new Error(`PDF text does not match regex: ${regex}`);
        }
    }

    /** Assert PDF text does NOT match a regex */
    async assertNotMatches(regex: RegExp) {
        if (regex.test(this.rawText)) {
            throw new Error(`PDF text unexpectedly matches regex: ${regex}`);
        }
    }

    /**
     * Assert that lines containing expected text are present (order-independent).
     * Useful for checking content that may appear in any order.
     */
    async assertContainsLines(
        expectedLines: string[],
        options: PdfToolOptions & { unordered?: boolean } = {},
    ) {
        const mergedOptions: PdfToolOptions = { ...this.baseOptions, ...options };
        const unordered = (options as any).unordered ?? false;

        const normalizedExpected = expectedLines.map(line =>
            PdfDocument.normalizeText(line, mergedOptions),
        );

        // Use already-normalized lines directly; re-normalizing would
        // cause ignoreFields regexes to match across the entire single-line
        // text (no newlines left), destroying content beyond the field label.
        const actualLines = this.lines;

        if (unordered) {
            // Check if all expected lines exist (in any order)
            for (const expectedLine of normalizedExpected) {
                if (!actualLines.some(actual => actual.includes(expectedLine))) {
                    throw new Error(
                        `PDF does not contain expected line: "${expectedLine}".\n\nActual lines:\n${actualLines.join('\n')}`,
                    );
                }
            }
        } else {
            // Check if lines appear in order within the full normalized text
            const fullText = actualLines.join(' ');
            let lastPos = -1;
            for (const expectedLine of normalizedExpected) {
                const pos = fullText.indexOf(expectedLine, lastPos + 1);
                if (pos === -1) {
                    throw new Error(
                        `PDF does not contain expected line in order: "${expectedLine}".`,
                    );
                }
                lastPos = pos;
            }
        }
    }

    /**
     * Simple "Field: Value" check.
     * Looks for "fieldLabel: some value" and compares the value.
     * Can optionally match multiline values.
     */
    async assertFieldEquals(
        fieldLabel: string,
        expectedValue: string,
        options: PdfToolOptions = {},
    ) {
        const result = this.extractFieldValue(fieldLabel, options);

        if (!result) {
            throw new Error(`Field "${fieldLabel}" not found in PDF.`);
        }

        const expectedNorm = PdfDocument.normalizeText(expectedValue, {
            ...this.baseOptions,
            ...options,
        });

        if (result !== expectedNorm) {
            throw new Error(
                `Field "${fieldLabel}" mismatch.\n\nExpected: "${expectedValue}"\nActual: "${result}"`,
            );
        }
    }

    /** Extract a single field value (returns null if not found) */
    private extractFieldValue(fieldLabel: string, options: PdfToolOptions = {}): string | null {
        const mergedOptions: PdfToolOptions = { ...this.baseOptions, ...options };

        // Basic pattern: Field Label: value (until newline or end)
        const regex = new RegExp(
            `${escapeRegExp(fieldLabel)}\\s*[:\\-]\\s*(.+?)(?:\\n|$)`,
            mergedOptions.ignoreCase ? 'i' : '',
        );

        const match = this.rawText.match(regex);
        if (!match) {
            return null;
        }

        const actualValueRaw = match[1];
        return PdfDocument.normalizeText(actualValueRaw, mergedOptions);
    }

    /**
     * Extract all occurrences of a field value.
     * Useful for repeated fields like invoice line items.
     */
    async extractAllFieldValues(
        fieldLabel: string,
        options: PdfToolOptions = {},
    ): Promise<string[]> {
        const mergedOptions: PdfToolOptions = { ...this.baseOptions, ...options };
        const regex = new RegExp(
            `${escapeRegExp(fieldLabel)}\\s*[:\\-]\\s*(.+?)(?:\\n|$)`,
            mergedOptions.ignoreCase ? 'gi' : 'g',
        );

        const values: string[] = [];
        let match;

        while ((match = regex.exec(this.rawText)) !== null) {
            const normalized = PdfDocument.normalizeText(match[1], mergedOptions);
            values.push(normalized);
        }

        return values;
    }

    /**
     * Assert a field has one of expected values (for repeated fields).
     */
    async assertFieldContainsOneOf(
        fieldLabel: string,
        expectedValues: string[],
        options: PdfToolOptions = {},
    ) {
        const allValues = await this.extractAllFieldValues(fieldLabel, options);
        const mergedOptions: PdfToolOptions = { ...this.baseOptions, ...options };

        const normalizedExpected = expectedValues.map(v =>
            PdfDocument.normalizeText(v, mergedOptions),
        );

        const foundMatch = normalizedExpected.some(expected =>
            allValues.some(actual => actual === expected),
        );

        if (!foundMatch) {
            throw new Error(
                `Field "${fieldLabel}" values ${JSON.stringify(allValues)} do not match any of expected: ${JSON.stringify(expectedValues)}`,
            );
        }
    }

    /**
     * Assert numeric field with tolerance (for amounts with formatting differences).
     * Extracts numeric value and compares with optional tolerance.
     */
    async assertNumericFieldEquals(
        fieldLabel: string,
        expectedValue: number,
        options: PdfToolOptions & { tolerance?: number } = {},
    ) {
        const tolerance = (options as any).tolerance ?? 0.01;
        const value = this.extractFieldValue(fieldLabel, options);

        if (!value) {
            throw new Error(`Field "${fieldLabel}" not found in PDF.`);
        }

        // Extract first number from the value (handles currency, commas, decimals)
        const numberMatch = value.match(/[\d.,]+/);
        if (!numberMatch) {
            throw new Error(
                `Field "${fieldLabel}" does not contain a numeric value. Got: "${value}"`,
            );
        }

        const actualValue = parseFloat(numberMatch[0].replace(/,/g, ''));

        if (Math.abs(actualValue - expectedValue) > tolerance) {
            throw new Error(
                `Field "${fieldLabel}" numeric mismatch.\n\nExpected: ${expectedValue}\nActual: ${actualValue}\nTolerance: ${tolerance}`,
            );
        }
    }

    /**
     * Assert a numeric field is within a range.
     */
    async assertFieldBetween(
        fieldLabel: string,
        minValue: number,
        maxValue: number,
        options: PdfToolOptions = {},
    ) {
        const value = this.extractFieldValue(fieldLabel, options);

        if (!value) {
            throw new Error(`Field "${fieldLabel}" not found in PDF.`);
        }

        const numberMatch = value.match(/[\d.,]+/);
        if (!numberMatch) {
            throw new Error(
                `Field "${fieldLabel}" does not contain a numeric value. Got: "${value}"`,
            );
        }

        const actualValue = parseFloat(numberMatch[0].replace(/,/g, ''));

        if (actualValue < minValue || actualValue > maxValue) {
            throw new Error(
                `Field "${fieldLabel}" value ${actualValue} is not between ${minValue} and ${maxValue}.`,
            );
        }
    }

    /**
     * Extract a table of data between two patterns.
     * Returns array of row objects keyed by headers.
     */
    async extractTable(
        tableStartPattern: RegExp | string,
        tableEndPattern?: RegExp | string,
        options: PdfToolOptions = {},
    ): Promise<Record<string, string>[]> {
        const startRegex =
            typeof tableStartPattern === 'string'
                ? new RegExp(escapeRegExp(tableStartPattern))
                : tableStartPattern;

        const endRegex = tableEndPattern
            ? typeof tableEndPattern === 'string'
                ? new RegExp(escapeRegExp(tableEndPattern))
                : tableEndPattern
            : null;

        let tableText = this.rawText;

        const startMatch = startRegex.exec(this.rawText);
        if (!startMatch) {
            throw new Error(`Table start pattern not found: ${tableStartPattern}`);
        }

        tableText = this.rawText.substring(startMatch.index + startMatch[0].length);

        if (endRegex) {
            const endMatch = endRegex.exec(tableText);
            if (endMatch) {
                tableText = tableText.substring(0, endMatch.index);
            }
        }

        // Parse table rows (simple split by newline)
        const rows = tableText
            .split('\n')
            .map(row => row.trim())
            .filter(row => row && row.length > 0);

        // Convert to objects (simple approach: treat consecutive values as row)
        const result: Record<string, string>[] = [];
        for (const row of rows) {
            const values = row.split(/\s{2,}/).filter(v => v);
            if (values.length > 0) {
                result.push({
                    raw: row,
                    values: values.join(' | '),
                });
            }
        }

        return result;
    }

    /**
     * Assert PDF contains all expected content with flexible matching.
     * Great for checking multiple critical pieces without order dependency.
     */
    async assertContainsAll(
        expectedContent: string[],
        options: PdfToolOptions = {},
    ) {
        const mergedOptions: PdfToolOptions = { ...this.baseOptions, ...options };
        const normalized = PdfDocument.normalizeText(this.rawText, mergedOptions);

        const missing: string[] = [];

        for (const content of expectedContent) {
            const normalizedContent = PdfDocument.normalizeText(content, mergedOptions);
            if (!normalized.includes(normalizedContent)) {
                missing.push(content);
            }
        }

        if (missing.length > 0) {
            throw new Error(
                `PDF does not contain all expected content. Missing: ${JSON.stringify(missing)}`,
            );
        }
    }

    /** Factory method: parse from raw Buffer/Uint8Array using PDFParse (new API) */
    static async fromBuffer(
        buffer: Uint8Array,
        options: PdfToolOptions = {},
    ): Promise<PdfDocument> {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        await parser.destroy();

        const rawText = data.text;
        
        // Validate extractable text
        if (!rawText || rawText.trim().length === 0) {
            throw new Error(
                'PDF contains no extractable text. This may be an image-only PDF or a scanned document.',
            );
        }

        return new PdfDocument(rawText, options);
    }
}

/** Helper to expose main class under a convenient name */
export class PdfTool {
    static async fromBuffer(
        buffer: Uint8Array,
        options: PdfToolOptions = {},
    ): Promise<PdfDocument> {
        return PdfDocument.fromBuffer(buffer, options);
    }
}

/** Utility: escape regex special chars in a string */
function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}