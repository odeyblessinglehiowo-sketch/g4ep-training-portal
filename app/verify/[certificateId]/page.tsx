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
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">
            Verification Failed
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Certificate not found
          </h1>

          <p className="mt-4 text-sm text-slate-600">
            The certificate could not be verified. It may be invalid or not yet issued.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Certificate Verified
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          This certificate is authentic
        </h1>

        <p className="mt-4 text-sm text-slate-600">
          The certificate ID below matches a valid issued certificate in the G4EP Project RISE portal.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Student Name</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {certificate.student.user.name}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Training Track</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {certificate.student.track}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Certificate ID</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {certificate.certificateId}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Issued Date</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {certificate.issuedAt
                ? new Date(certificate.issuedAt).toLocaleDateString()
                : "Not available"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}