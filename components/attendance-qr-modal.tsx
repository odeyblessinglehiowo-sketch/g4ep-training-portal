"use client";

import { useState } from "react";

export default function AttendanceQrModal({
  qrCodeDataUrl,
  title,
}: {
  qrCodeDataUrl: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-none bg-white p-3 ring-1 ring-slate-200 transition hover:ring-emerald-300"
      >
        <img
          src={qrCodeDataUrl}
          alt={`QR code for ${title}`}
          className="mx-auto h-36 w-36 sm:h-40 sm:w-40"
        />
        <p className="mt-2 text-center text-[11px] font-semibold text-emerald-700 sm:text-xs">
          Tap to enlarge
        </p>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="relative w-full max-w-xl bg-white p-4 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Close
            </button>

            <div className="pt-8">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Attendance QR Code
              </p>
              <h3 className="mt-1 text-center text-base font-bold text-slate-900 sm:text-lg">
                {title}
              </h3>

              <div className="mt-4 flex justify-center bg-slate-50 p-4 ring-1 ring-slate-200">
                <img
                  src={qrCodeDataUrl}
                  alt={`QR code for ${title}`}
                  className="h-72 w-72 max-w-full sm:h-80 sm:w-80"
                />
              </div>

              <p className="mt-3 text-center text-sm text-slate-600">
                Students can scan this enlarged QR code and check in easily.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}