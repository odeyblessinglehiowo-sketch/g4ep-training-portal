import React from "react";
import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { CertificatePdf } from "@/lib/certificate-pdf";

export async function GET() {
  const session = await getSession();

  if (!session.userId || session.role !== "STUDENT") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const studentUser = await db.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      student: true,
    },
  });

  if (!studentUser || !studentUser.student) {
    return new NextResponse("Student profile not found.", { status: 404 });
  }

  const student = studentUser.student;

  const certificate = await db.certificate.findFirst({
    where: {
      studentId: student.id,
      status: "ISSUED",
    },
    orderBy: {
      issuedAt: "desc",
    },
  });

  if (!certificate || !certificate.certificateId) {
    return new NextResponse("Issued certificate not found.", { status: 404 });
  }

  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/verify/${certificate.certificateId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

  const pdfStream = await renderToStream(
    <CertificatePdf
      studentName={studentUser.name}
      track={student.track}
      certificateId={certificate.certificateId}
      issuedAt={certificate.issuedAt}
      verificationUrl={verificationUrl}
      qrCodeDataUrl={qrCodeDataUrl}
      logoUrl={`${baseUrl}/logo/g4ep.png`}
      signatureOneUrl={`${baseUrl}/signatures/g4ep-signature-1.png`}
      signatureTwoUrl={`${baseUrl}/signatures/g4ep-signature-2.png`}
      sealUrl={`${baseUrl}/seals/g4ep-seal.png`}
    />
  );

  return new NextResponse(pdfStream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${studentUser.name
        .replace(/\s+/g, "-")
        .toLowerCase()}-certificate.pdf"`,
    },
  });
}