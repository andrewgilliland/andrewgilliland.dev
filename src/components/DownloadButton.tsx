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
      <div className="absolute bottom-0 h-full w-full transform-gpu rounded border-2 border-white bg-pink-600 transition group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-0 group-active:translate-y-0" />
      <div className="absolute bottom-0 h-full w-full rounded border-2 border-white bg-cyan-600" />
      <div className="min-w-max transform-gpu rounded border-2 border-white bg-black px-12 py-4 transition group-hover:-translate-x-2 group-hover:-translate-y-2 group-active:translate-x-0 group-active:translate-y-0 md:px-24 md:text-2xl">
        Download
      </div>
    </button>
  );
};

export default DownloadButton;
