import { Injectable } from '@angular/core';
import { Candidate, EvaluationRatings } from '../models/candidate.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class PdfService {

  generateReport(candidate: Candidate): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Interview Evaluation Report', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(11);
    doc.text('Walk-in Drive - Java Full Stack Developer', pageWidth / 2, 28, { align: 'center' });
    doc.text(new Date(candidate.interviewDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }), pageWidth / 2, 35, { align: 'center' });

    // Candidate Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text('Candidate Details', 14, 52);
    doc.setDrawColor(99, 102, 241);
    doc.line(14, 54, pageWidth - 14, 54);

    const rating = candidate.overallRating ?? candidate.score ?? 0;
    const pct = Math.round((rating / 5) * 100);

    doc.setFontSize(10);
    doc.text(`Name: ${candidate.name}`, 14, 62);
    doc.text(`Experience: ${candidate.experience} years`, 14, 69);
    doc.text(`Questions Asked: ${candidate.questions.length}`, 14, 76);
    if (candidate.interviewerName) {
      doc.text(`Interviewed By: ${candidate.interviewerName}`, 14, 83);
    }
    doc.text(`Performance: ${rating}/5 (${pct}%)`, 110, 62);

    // Verdict color indicator
    if (pct >= 70) {
      doc.setTextColor(22, 163, 74);
      doc.text('RECOMMENDED', 110, 69);
    } else if (pct >= 50) {
      doc.setTextColor(217, 119, 6);
      doc.text('AVERAGE', 110, 69);
    } else {
      doc.setTextColor(220, 38, 38);
      doc.text('NOT RECOMMENDED', 110, 69);
    }
    doc.setTextColor(0, 0, 0);

    // Evaluation Ratings
    let nextY = candidate.interviewerName ? 96 : 90;
    if (candidate.evaluation) {
      doc.setFontSize(13);
      doc.text('Evaluation Ratings', 14, nextY);
      doc.line(14, nextY + 2, pageWidth - 14, nextY + 2);

      const evalCriteria: { key: keyof EvaluationRatings; label: string }[] = [
        { key: 'technicalSkills', label: 'Technical Skills' },
        { key: 'confidence', label: 'Confidence' },
        { key: 'behaviour', label: 'Behaviour' },
        { key: 'problemSolving', label: 'Problem Solving' },
        { key: 'communication', label: 'Communication' }
      ];

      const evalData = evalCriteria.map(c => {
        const val = candidate.evaluation![c.key] ?? 0;
        const stars = '★'.repeat(val) + '☆'.repeat(5 - val);
        return [c.label, stars, `${val}/5`];
      });

      autoTable(doc, {
        startY: nextY + 6,
        head: [['Criteria', 'Rating', 'Score']],
        body: evalData,
        theme: 'grid',
        headStyles: { fillColor: [30, 27, 75], fontSize: 9 },
        bodyStyles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 80, fontSize: 12 },
          2: { cellWidth: 30, fontStyle: 'bold' }
        },
        didParseCell: (data: any) => {
          if (data.column.index === 1 && data.section === 'body') {
            data.cell.styles.textColor = [245, 158, 11];
          }
        }
      });
      nextY = (doc as any).lastAutoTable?.finalY ?? nextY + 50;
      nextY += 8;
    }

    // Candidate Feedback
    if (candidate.evaluationFeedback) {
      doc.setFontSize(13);
      doc.text('Candidate Feedback', 14, nextY);
      doc.line(14, nextY + 2, pageWidth - 14, nextY + 2);
      doc.setFontSize(10);
      const fbLines = doc.splitTextToSize(candidate.evaluationFeedback, pageWidth - 28);
      doc.text(fbLines, 14, nextY + 10);
      nextY += 10 + fbLines.length * 5 + 8;
    }

    // Questions asked table
    doc.setFontSize(13);
    doc.text('Questions Asked', 14, nextY);
    doc.line(14, nextY + 2, pageWidth - 14, nextY + 2);

    const qData = candidate.questions.map((q, i) => [
      `${i + 1}`,
      q.category,
      q.question.length > 80 ? q.question.substring(0, 77) + '...' : q.question,
      q.difficulty
    ]);

    autoTable(doc, {
      startY: nextY + 4,
      head: [['#', 'Category', 'Question', 'Difficulty']],
      body: qData,
      theme: 'grid',
      headStyles: { fillColor: [30, 27, 75], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 120 },
        3: { cellWidth: 20 }
      }
    });

    // Interviewer Notes
    const finalY = (doc as any).lastAutoTable?.finalY ?? 140;
    if (candidate.overallNotes) {
      doc.setFontSize(13);
      doc.text('Interviewer Notes', 14, finalY + 14);
      doc.line(14, finalY + 16, pageWidth - 14, finalY + 16);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(candidate.overallNotes, pageWidth - 28);
      doc.text(lines, 14, finalY + 24);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount} | Interview Helper | Created by Amaan Khan`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`${candidate.name.replace(/\s+/g, '_')}_Evaluation_Report.pdf`);
  }

  generateSummaryReport(candidates: Candidate[]): void {
    const completed = candidates.filter(c => c.status === 'completed');
    if (completed.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Header
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, pageWidth, 42, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Walk-in Drive — Final Summary', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(11);
    doc.text('Java Full Stack Developer', pageWidth / 2, 26, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Date: ${today}  |  Total Candidates: ${completed.length}`, pageWidth / 2, 35, { align: 'center' });

    // Summary stats
    let y = 52;
    const recommended = completed.filter(c => {
      const r = c.overallRating ?? c.score ?? 0;
      return (r / 5) * 100 >= 70;
    }).length;
    const average = completed.filter(c => {
      const r = c.overallRating ?? c.score ?? 0;
      const pct = (r / 5) * 100;
      return pct >= 50 && pct < 70;
    }).length;
    const notRecommended = completed.length - recommended - average;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text('Overview', 14, y);
    doc.setDrawColor(99, 102, 241);
    doc.line(14, y + 2, pageWidth - 14, y + 2);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text(`Recommended: ${recommended}`, 14, y);
    doc.setTextColor(217, 119, 6);
    doc.text(`Average: ${average}`, 80, y);
    doc.setTextColor(220, 38, 38);
    doc.text(`Not Recommended: ${notRecommended}`, 130, y);
    doc.setTextColor(0, 0, 0);
    y += 14;

    // Candidate summary table
    doc.setFontSize(13);
    doc.text('Candidate Results', 14, y);
    doc.line(14, y + 2, pageWidth - 14, y + 2);
    y += 6;

    const tableBody = completed
      .sort((a, b) => {
        const rA = a.overallRating ?? a.score ?? 0;
        const rB = b.overallRating ?? b.score ?? 0;
        return rB - rA;
      })
      .map((c, i) => {
        const rating = c.overallRating ?? c.score ?? 0;
        const pct = Math.round((rating / 5) * 100);
        const rec = pct >= 70 ? 'RECOMMENDED' : pct >= 50 ? 'AVERAGE' : 'NOT RECOMMENDED';

        return [
          `${i + 1}`,
          c.name,
          `${c.experience}`,
          `${c.questions.length}`,
          `${rating}/5`,
          `${pct}%`,
          rec
        ];
      });

    autoTable(doc, {
      startY: y,
      head: [['#', 'Candidate', 'Exp', 'Questions', 'Rating', 'Score %', 'Verdict']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 27, 75], fontSize: 8, cellPadding: 3 },
      bodyStyles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 42 },
        2: { cellWidth: 12 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 40 }
      },
      didParseCell: (data: any) => {
        if (data.column.index === 6 && data.section === 'body') {
          if (data.cell.raw === 'RECOMMENDED') {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.raw === 'AVERAGE') {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount} | Interview Helper | Created by Amaan Khan`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`Walk-in_Drive_Summary_${today.replace(/\s+/g, '_')}.pdf`);
  }
}
