import { Component } from '@angular/core';
import { SafeUrlPipe } from './safe-url-pipe';
import { CommonModule } from '@angular/common';


interface PdfDocument {
  id: string;
  name: string;
  path: string;
}


@Component({
  selector: 'app-root',
  imports:  [SafeUrlPipe, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'pdf-tool';

  pdfDocuments: PdfDocument[] = [
    {
      id: 'invoice',
      name: 'Sample Invoice',
      path: 'assets/sample-invoice.pdf',
    },
    {
      id: 'report',
      name: 'Sample Report',
      path: 'assets/sample-report.pdf',
    },
  ];

  selectedPdf: PdfDocument = this.pdfDocuments[0];

  onPdfChange(id: string) {
    const doc = this.pdfDocuments.find((d) => d.id === id);
    if (doc) {
      this.selectedPdf = doc;
    }
  }

  get selectedPdfUrl(): string {
    return this.selectedPdf.path;
  }

  downloadSelectedPdf() {
    window.open(this.selectedPdf.path, '_blank');
  }
}
