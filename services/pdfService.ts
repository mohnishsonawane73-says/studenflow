import { jsPDF } from "jspdf";

export const generatePDF = (question: string, solution: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxLineWidth = pageWidth - (margin * 2);

  let cursorY = 20;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(50, 50, 200); // Blue-ish
  doc.text("StudenFlow Solution", margin, cursorY);
  
  cursorY += 10;
  
  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, cursorY);

  cursorY += 15;

  // Question Section
  if (question.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Question:", margin, cursorY);
    cursorY += 7;

    doc.setFont("courier", "normal");
    doc.setFontSize(11);
    const questionLines = doc.splitTextToSize(question, maxLineWidth);
    doc.text(questionLines, margin, cursorY);
    cursorY += (questionLines.length * 5) + 10;
  } else {
      // If image only, just note it
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.text("[Image Question Uploaded]", margin, cursorY);
      cursorY += 15;
  }

  // Solution Section (Sanitizing Markdown roughly for PDF text)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Professional Solution:", margin, cursorY);
  cursorY += 7;

  doc.setFont("times", "normal");
  doc.setFontSize(12);

  // Strip standard markdown bold/italic chars for cleaner PDF text
  const cleanSolution = solution
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#/g, '');

  const solutionLines = doc.splitTextToSize(cleanSolution, maxLineWidth);
  
  // Pagination check
  if (cursorY + (solutionLines.length * 6) > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      cursorY = 20;
  }

  doc.text(solutionLines, margin, cursorY);

  // Footer
  const pageCount = doc.internal.pages.length - 1; // jspdf quirk
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount} - StudenFlow`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save("StudenFlow_Solution.pdf");
};