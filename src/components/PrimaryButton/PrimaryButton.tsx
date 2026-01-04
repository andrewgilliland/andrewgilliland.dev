type PrimaryButtonProps = {
  className?: string;
  onClick?: () => void;
  href?: string;
  text: string;
};

const PrimaryButton = ({
  className,
  onClick,
  href,
  text,
}: PrimaryButtonProps) => {
  return (
    <button
      onClick={onClick}
      data-cy="primary-button"
      className={`group relative ${className}`}
    >
      <a href={href}>
        <div className="absolute bottom-0 h-full w-full transform-gpu rounded border-2 border-black bg-cyan-400 transition group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-0 group-active:translate-y-0" />
        <div className="absolute bottom-0 h-full w-full rounded border-2 border-black bg-red-400" />
        <div className="min-w-max transform-gpu rounded bg-black px-12 py-4 text-white transition group-hover:-translate-x-2 group-hover:-translate-y-2 group-active:translate-x-0 group-active:translate-y-0 md:px-24 md:text-2xl">
          {text}
        </div>
      </a>
    </button>
  );
};

export default PrimaryButton;
