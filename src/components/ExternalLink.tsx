const ExternalLink = ({ href, text }) => {
  return (
    <a className="group" href={href}>
      <div className="font-semibold text-black text-xl">{text}</div>
      <div className="bg-black h-0.5 w-[0%] rounded-full group-hover:w-full transition-all" />
    </a>
  );
};

export default ExternalLink;
