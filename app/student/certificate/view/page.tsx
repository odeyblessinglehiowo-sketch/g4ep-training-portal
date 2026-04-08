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
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Certificate Preview
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
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
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://portal.geeeep.com.ng";

  const verificationUrl = `${baseUrl}/verify/${certificate.certificateId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

  const issuedDate = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString()
    : "Not issued yet";

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-[1480px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              Certificate Preview
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Certificate of Completion
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/student/certificate"
              className="bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back
            </a>

            <a
              href="/student/certificate/download"
              className="bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Download PDF
            </a>
          </div>
        </div>

        {/* MOBILE */}
        <section className="border-[6px] border-green-800 bg-white shadow-xl md:hidden">
          <div className="relative overflow-hidden p-3">
            {/* outer fine line */}
            <div className="absolute inset-2 border border-emerald-200" />

            {/* watermark */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
              <div className="flex h-full items-center justify-center">
                <img
                  src="/logo/g4ep.png"
                  alt="G4EP watermark"
                  className="h-[88%] w-[88%] object-contain"
                />
              </div>
            </div>

            <div className="relative z-10 border border-emerald-100 px-3 py-4">
              <div className="flex items-start justify-between gap-2">
                <img
                  src="/logo/g4ep.png"
                  alt="G4EP logo"
                  className="h-10 w-auto object-contain"
                />

                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-green-700">
                    RISE Ttaining
                  </p>
                  <p className="mt-1 max-w-[140px] text-[9px] leading-4 text-slate-500">
                    Renewed Hope for Inclusive Support and Empowerment
                  </p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[30px] font-semibold italic leading-none text-green-800">
                  Certificate
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.32em] text-slate-500">
                  of completion
                </p>

                <div className="mx-auto mt-3 h-px w-24 bg-emerald-200" />

                <p className="mt-3 text-[11px] text-slate-600">
                  This certificate is presented to
                </p>

                <h2 className="mt-2 text-[30px] font-bold italic leading-tight text-slate-900">
                  {studentUser.name}
                </h2>

                <p className="mt-3 text-[11px] text-slate-600">
                  for successfully completing the 4 weeks course in
                </p>

                <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.26em] text-[#a18c2c]">
                  {student.track}
                </p>

                <div className="mx-auto mt-3 h-px w-24 bg-emerald-200" />
              </div>

              <div className="mt-4 grid gap-2">
                <InfoBox label="Certificate ID" value={certificate.certificateId} />
                <div className="grid grid-cols-2 gap-2">
                  <InfoBox label="Track" value={student.track} />
                  <InfoBox label="Issued Date" value={issuedDate} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="text-center">
                  <img
                    src="/signatures/g4ep-signature-1.png"
                    alt="Signature 1"
                    className="mx-auto h-8 w-auto object-contain"
                  />
                  <div className="mx-auto mt-1 w-full border-t border-slate-400 pt-1">
                    <p className="text-[9px] font-semibold leading-tight text-slate-900">
                      Dr. Judith Mayen Ogbara
                    </p>
                    <p className="mt-0.5 text-[8px] leading-tight text-slate-600">
                      Chairman, G4EP
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <img
                    src="/signatures/g4ep-signature-2.png"
                    alt="Signature 2"
                    className="mx-auto h-8 w-auto object-contain"
                  />
                  <div className="mx-auto mt-1 w-full border-t border-slate-400 pt-1">
                    <p className="text-[9px] font-semibold leading-tight text-slate-900">
                      Dr. Babajide Akinbohun
                    </p>
                    <p className="mt-0.5 text-[8px] leading-tight text-slate-600">
                      Executive Director, Projects
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-center gap-3">
                <img
                  src="/seals/g4ep-seal.png"
                  alt="Official seal"
                  className="h-12 w-12 object-contain"
                />

                <div className="border border-slate-200 bg-white p-1.5 shadow-sm">
                  <img
                    src={qrCodeDataUrl}
                    alt="Certificate QR Code"
                    className="h-20 w-20"
                  />
                </div>
              </div>

              <p className="mt-1 text-center text-[9px] text-slate-500">
                Scan to verify certificate
              </p>
            </div>
          </div>
        </section>

        {/* DESKTOP */}
        <section className="relative hidden border-[8px] border-green-800 bg-white shadow-xl md:block">
          {/* outer soft line */}
          <div className="absolute inset-3 border border-emerald-200" />

          {/* watermark */}
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="flex h-full items-center justify-center">
              <img
                src="/logo/g4ep.png"
                alt="G4EP watermark"
                className="h-[86%] w-[86%] object-contain"
              />
            </div>
          </div>

          <div className="relative z-10 border border-emerald-100 px-10 py-8 lg:px-12 lg:py-8">
            <div className="flex items-start justify-between gap-4">
              <img
                src="/logo/g4ep.png"
                alt="G4EP logo"
                className="h-16 w-auto object-contain lg:h-18"
              />

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.3em] text-green-700 lg:text-sm">
                  Project RISE
                </p>
                <p className="mt-1 text-xs text-slate-500 lg:text-sm">
                  Renewed Hope for Inclusive Support and Empowerment
                </p>
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className="text-5xl font-semibold italic leading-none text-green-800 lg:text-6xl">
                Certificate
              </p>

              <p className="mt-1 text-[11px] uppercase tracking-[0.38em] text-slate-500 lg:text-sm">
                of completion
              </p>

              <div className="mx-auto mt-4 h-px w-32 bg-emerald-200" />

              <p className="mt-4 text-sm text-slate-600">
                This certificate is presented to
              </p>

              <h2 className="mt-3 text-5xl font-bold italic leading-tight text-slate-900 lg:text-6xl">
                {studentUser.name}
              </h2>

              <p className="mt-4 text-sm text-slate-600">
                for successfully completing the 4 weeks course in
              </p>

              <p className="mt-2 text-lg font-semibold uppercase tracking-[0.32em] text-[#a18c2c]">
                {student.track}
              </p>

              <div className="mx-auto mt-4 h-px w-32 bg-emerald-200" />
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-3">
              <InfoBox label="Certificate ID" value={certificate.certificateId} large />
              <InfoBox label="Track" value={student.track} large />
              <InfoBox label="Issued Date" value={issuedDate} large />
            </div>

            <div className="mt-8 grid items-end gap-6 lg:grid-cols-[1fr_auto_1fr]">
              <div className="text-center">
                <img
                  src="/signatures/g4ep-signature-1.png"
                  alt="Signature 1"
                  className="mx-auto h-12 w-auto object-contain"
                />
                <div className="mx-auto mt-1 w-52 border-t border-slate-400 pt-1">
                  <p className="text-[11px] font-semibold leading-tight text-slate-900">
                    Dr. Judith Mayen Ogbara
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-slate-600">
                    Chairman, G4EP
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <img
                  src="/seals/g4ep-seal.png"
                  alt="Official seal"
                  className="h-14 w-14 object-contain lg:h-16 lg:w-16"
                />

                <div className="mt-2 border border-slate-200 bg-white p-2 shadow-sm">
                  <img
                    src={qrCodeDataUrl}
                    alt="Certificate QR Code"
                    className="h-24 w-24 lg:h-26 lg:w-26"
                  />
                </div>

                <p className="mt-2 text-[10px] text-slate-500 lg:text-xs">
                  Scan to verify certificate
                </p>
              </div>

              <div className="text-center">
                <img
                  src="/signatures/g4ep-signature-2.png"
                  alt="Signature 2"
                  className="mx-auto h-12 w-auto object-contain"
                />
                <div className="mx-auto mt-1 w-56 border-t border-slate-400 pt-1">
                  <p className="text-[11px] font-semibold leading-tight text-slate-900">
                    Dr. Babajide Akinbohun
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-slate-600">
                    Executive Director, Projects
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoBox({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-3 lg:p-4">
      <p className={`font-medium text-slate-500 ${large ? "text-sm" : "text-[11px]"}`}>
        {label}
      </p>
      <p className={`mt-1 font-bold text-slate-900 ${large ? "text-lg" : "text-sm"}`}>
        {value}
      </p>
    </div>
  );
}