import { requireRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export default async function StudentCertificatePreviewPage() {
  const currentUser = await requireRole("STUDENT");

  const studentUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      student: true,
    },
  });

  if (!studentUser || !studentUser.student) {
    throw new Error("Student profile not found.");
  }

  const student = studentUser.student;

  const certificate = await db.certificate.findFirst({
    where: {
      studentId: student.id,
    },
    orderBy: {
      issuedAt: "desc",
    },
  });

  if (!certificate || certificate.status !== "ISSUED" || !certificate.certificateId) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Certificate Preview
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Certificate not available
          </h1>

          <p className="mt-4 text-sm text-slate-600">
            Your certificate has not been issued yet. Please wait for admin approval.
          </p>
        </div>
      </main>
    );
  }

  const baseUrl =
    process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const verificationUrl = `${baseUrl}/verify/${certificate.certificateId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              Certificate Preview
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Certificate of Completion
            </h1>
          </div>

          <a
            href="/student/certificate"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to Certificate Status
          </a>
        </div>

        <section className="relative mx-auto w-full overflow-hidden rounded-[2rem] border-[10px] border-green-800 bg-white shadow-xl aspect-[1.414/1]">
          <div className="absolute inset-0 opacity-[0.045]">
            <div className="flex h-full items-center justify-center">
              <img
                src="/logo/g4ep.png"
                alt="G4EP watermark"
                className="h-[52%] w-auto object-contain"
              />
            </div>
          </div>

          <div className="relative z-10 flex h-full flex-col px-8 py-6 md:px-12 md:py-8">
            <div className="flex items-start justify-between gap-4">
              <img
                src="/logo/g4ep.png"
                alt="G4EP logo"
                className="h-16 w-auto object-contain md:h-20"
              />

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.3em] text-green-700 md:text-sm">
                  Project RISE
                </p>
                <p className="mt-1 text-xs text-slate-500 md:text-sm">
                  Renewed Hope for Inclusive Support and Empowerment
                </p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-4xl font-semibold italic text-green-800 md:text-6xl">
                Certificate
              </p>

              <p className="mt-1 text-[11px] uppercase tracking-[0.38em] text-slate-500 md:text-sm">
                of completion
              </p>

              <p className="mt-4 text-sm text-slate-600">
                This certificate is presented to
              </p>

              <h2 className="mt-2 text-4xl font-bold italic leading-tight text-slate-900 md:text-6xl">
                {studentUser.name}
              </h2>

              <p className="mt-4 text-sm text-slate-600">
                for successfully completing the 4 weeks course in
              </p>

              <p className="mt-2 text-base font-semibold uppercase tracking-[0.32em] text-[#a18c2c] md:text-lg">
                {student.track}
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 md:p-4">
                <p className="text-xs font-medium text-slate-500 md:text-sm">
                  Certificate ID
                </p>
                <p className="mt-1 text-base font-bold text-slate-900 md:text-lg">
                  {certificate.certificateId}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 md:p-4">
                <p className="text-xs font-medium text-slate-500 md:text-sm">
                  Track
                </p>
                <p className="mt-1 text-base font-bold text-slate-900 md:text-lg">
                  {student.track}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 md:p-4">
                <p className="text-xs font-medium text-slate-500 md:text-sm">
                  Issued Date
                </p>
                <p className="mt-1 text-base font-bold text-slate-900 md:text-lg">
                  {certificate.issuedAt
                    ? new Date(certificate.issuedAt).toLocaleDateString()
                    : "Not issued yet"}
                </p>
              </div>
            </div>

            <div className="mt-auto grid gap-4 md:grid-cols-3 md:items-end">
              <div className="text-center">
                <img
                  src="/signatures/g4ep-signature-1.png"
                  alt="Signature 1"
                  className="mx-auto h-12 w-auto object-contain md:h-14"
                />
                <div className="mx-auto mt-1 w-44 border-t border-slate-400 pt-1">
                  <p className="text-[11px] font-semibold leading-tight text-slate-900 md:text-xs">
                    Dr. Judith Mayen Ogbara
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-slate-600 md:text-[11px]">
                    Chairman, G4EP
                  </p>
                </div>
              </div>

              <div className="text-center">
                <img
                  src="/seals/g4ep-seal.png"
                  alt="Official seal"
                  className="mx-auto h-16 w-16 object-contain md:h-20 md:w-20"
                />
              </div>

              <div className="text-center">
                <img
                  src="/signatures/g4ep-signature-2.png"
                  alt="Signature 2"
                  className="mx-auto h-12 w-auto object-contain md:h-14"
                />
                <div className="mx-auto mt-1 w-48 border-t border-slate-400 pt-1">
                  <p className="text-[11px] font-semibold leading-tight text-slate-900 md:text-xs">
                    Dr. Babajide Akinbohun
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-slate-600 md:text-[11px]">
                    Executive Director, Projects
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col items-center">
              <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <img
                  src={qrCodeDataUrl}
                  alt="Certificate QR Code"
                  className="h-20 w-20 md:h-24 md:w-24"
                />
              </div>

              <p className="mt-1 text-[10px] text-slate-500 md:text-xs">
                Scan to verify certificate
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-center">
          <a
            href="/student/certificate/download"
            className="rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            Download PDF
          </a>
        </div>
      </div>
    </main>
  );
}