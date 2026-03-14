type ExternalLinkProps = {
  href: string;
  text: string;
};

const ExternalLink = ({ href, text }: ExternalLinkProps) => {
  return (
    <a className="group" href={href}>
      <div className="text-xl font-semibold text-black">{text}</div>
      <div className="h-0.5 w-[0%] rounded-full bg-black transition-all group-hover:w-full" />
    </a>
  );
};

export default ExternalLink;
