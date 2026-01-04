"use client";
import { downloadPdf } from "@/lib/actions/md-to-pdf";

type DownloadButtonProps = {
  className?: string;
};

const DownloadButton = ({ className }: DownloadButtonProps) => {
  return (
    <button
      data-cy="download-button"
      className={`group relative ${className}`}
      //   onClick={downloadPdf}
    >
      <div className="absolute bg-pink-600 border-2 border-white w-full h-full rounded bottom-0 transform-gpu transition group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-0 group-active:translate-y-0" />
      <div className="absolute bg-cyan-600 border-2 border-white w-full h-full rounded bottom-0" />
      <div className="min-w-max md:text-2xl bg-black border-2 border-white rounded px-12 md:px-24 py-4 transform-gpu transition group-hover:-translate-x-2 group-hover:-translate-y-2 group-active:translate-x-0 group-active:translate-y-0">
        Download
      </div>
    </button>
  );
};

export default DownloadButton;
