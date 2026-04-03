import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{
    certificateId: string;
  }>;
}) {
  const { certificateId } = await params;

  const certificate = await db.certificate.findUnique({
    where: {
      certificateId,
    },
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!certificate || certificate.status !== "ISSUED") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <section className="overflow-hidden border border-red-200 bg-gradient-to-r from-red-600 via-rose-500 to-orange-400 px-4 py-5 text-white shadow-[0_18px_45px_-22px_rgba(239,68,68,0.45)] sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-50/90">
              Verification Failed
            </p>

            <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
              Certificate not found
            </h1>

            <p className="mt-2 text-xs text-red-50/90 sm:text-sm">
              The certificate could not be verified. It may be invalid or not yet issued.
            </p>
          </section>

          <section className="border border-red-100 bg-white p-4 shadow-sm">
            <div className="grid gap-3">
              <InfoCard
                label="Certificate ID"
                value={certificateId}
                tone="bg-red-50 ring-red-100"
                valueClass="text-red-700 break-all"
              />

              <div className="border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Double-check the certificate ID or confirm that the certificate has already been issued in the portal.
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-4">
        <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-5 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
            Certificate Verified
          </p>

          <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
            This certificate is authentic
          </h1>

          <p className="mt-2 text-xs text-emerald-50/90 sm:text-sm">
            The certificate ID below matches a valid issued certificate in the G4EP Project RISE portal.
          </p>
        </section>

        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <InfoCard
              label="Student Name"
              value={certificate.student.user.name}
            />

            <InfoCard
              label="Training Track"
              value={certificate.student.track}
            />

            <InfoCard
              label="Certificate ID"
              value={certificate.certificateId ?? "Not available"}
              valueClass="break-all"
            />

            <InfoCard
              label="Issued Date"
              value={
                certificate.issuedAt
                  ? new Date(certificate.issuedAt).toLocaleDateString()
                  : "Not available"
              }
            />
          </div>

          <div className="mt-4 border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 sm:text-xs">
              Verification Status
            </p>

            <p className="mt-1.5 text-sm font-semibold text-slate-900 sm:text-base">
              Verified and issued by G4EP Project RISE
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
              This certificate belongs to the named student and is valid in the portal records.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
  tone = "bg-slate-50 ring-slate-200",
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  tone?: string;
  valueClass?: string;
}) {
  return (
    <div className={`p-3 ring-1 ${tone}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
        {label}
      </p>
      <p className={`mt-1.5 text-sm font-bold sm:text-base ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}