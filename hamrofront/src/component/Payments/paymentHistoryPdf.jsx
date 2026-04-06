import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "../UI/button";

const PaymentHistoryPDF = ({ title, data, columns, filename }) => {
  const tableRef = useRef(null);

  const generatePDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const maxWidth = pageWidth - 2 * margin;

    // Header
    doc.setFontSize(18);
    doc.setTextColor(44, 59, 42); // #2C3B2A
    doc.text("HamroSamaj", margin, 20);
    doc.setFontSize(14);
    doc.text(title, margin, 30);
    doc.setFontSize(10);
    doc.setTextColor(92, 115, 97); // #5C7361
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 40);

    // Capture table
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = maxWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let position = 50;

    // Add table image to PDF
    if (position + imgHeight > pageHeight - margin) {
      const ratio = (pageHeight - position - margin) / imgHeight;
      doc.addImage(
        imgData,
        "PNG",
        margin,
        position,
        imgWidth * ratio,
        imgHeight * ratio,
      );
    } else {
      doc.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    }
    position += imgHeight + 10;

    // Footer
    const addFooter = () => {
      doc.setFontSize(10);
      doc.setTextColor(92, 115, 97);
      doc.text(
        `Page ${doc.internal.getNumberOfPages()} - HamroSamaj Payment Report`,
        margin,
        pageHeight - 10,
      );
    };

    addFooter();

    // Save PDF
    doc.save(`${filename}.pdf`);
  };

  return (
    <div>
      <Button
        onClick={generatePDF}
        className="bg-[#395917]  hover:bg-[#2C3B2A] text-white px-2 rounded-lg"
      >
        Download PDF
      </Button>
      <div style={{ position: "absolute", left: "-9999px" }} ref={tableRef}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#2C3B2A] text-white">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="px-4 py-2 text-left font-medium text-sm"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-[#E8EFEA] hover:bg-[#F5F8F6]"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-2 text-sm text-[#2C3B2A]"
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistoryPDF;
