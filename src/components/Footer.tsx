import { socialLinks } from "../lib/utils/social";
import Block from "./Block";
import ColorDivider from "./ColorDivider";

const Footer = () => (
  <>
    <ColorDivider className="h-6 w-full border-b-2 border-t-2 border-white" />
    <footer className="flex flex-col items-center justify-center bg-black px-[10%] py-8 lg:flex-row lg:justify-between">
      <div className="text-white">
        ⓒ {new Date().getFullYear()} Andrew Gilliland
      </div>
      <div className="mt-6 flex items-center gap-10 lg:mt-0">
        {socialLinks.map(({ Icon, href, color }, index) => (
          <a key={index} href={href} target="_blank" rel="noopener noreferrer">
            <Block
              backgroundColor={`bg-${color}-500`}
              height="12"
              width="12"
              theme="dark"
            >
              <Icon className="h-5 w-5 fill-white" />
            </Block>
          </a>
        ))}
      </div>
    </footer>
  </>
);

export default Footer;
