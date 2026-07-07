function slugFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `${slug}.pdf` : "report.pdf";
}

export async function exportElementToPdf(
  element: HTMLElement,
  title: string,
): Promise<void> {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ]);

  const canvas = await toCanvas(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    style: {
      transform: "none",
    },
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < imgHeight) {
    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, margin - offsetY, contentWidth, imgHeight);
    offsetY += pageHeight - margin * 2;
    pageIndex += 1;
  }

  pdf.save(slugFilename(title));
}
