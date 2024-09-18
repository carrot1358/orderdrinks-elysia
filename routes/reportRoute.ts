import { Elysia } from "elysia";
import { generatePDFReport } from "~/controllers";
import { admin, auth, driver } from "~/middlewares";

const reportRoute = new Elysia({ prefix: "/report" }).get(
  "/generate-pdf",
  async (context) => {
    try {
      const pdfBuffer = await generatePDFReport(context);

      // Check if pdfBuffer is the error response
      if (typeof pdfBuffer === "object" && "status" in pdfBuffer) {
        context.set.status = pdfBuffer.status;
        return pdfBuffer;
      }

      // If it's a successful PDF generation
      context.set.headers["Content-Type"] = "application/pdf";
      context.set.headers["Content-Disposition"] =
        "attachment; filename=water_filter_report.pdf";
      return new Response(pdfBuffer, {
        headers: context.set.headers,
      });
    } catch (error) {
      context.set.status = 500;
      return {
        status: 500,
        success: false,
        message: "An error occurred while generating the PDF report",
      };
    }
  },
  {
    beforeHandle: (c) => auth(c),
  }
);

export default reportRoute as any;
