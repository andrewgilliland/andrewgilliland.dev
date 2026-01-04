import { Page } from "../types";
import Container from "./Container";
import HeaderHeading from "./HeaderHeading";
import Link from "next/link";

type DesktopNavbarProps = {
  pages: Page[];
};

const DesktopNavbar = ({ pages }: DesktopNavbarProps) => (
  <div className="hidden border-b-2 border-white px-[10%] py-6 md:block">
    <Container>
      <div className="items-center justify-between md:flex">
        <HeaderHeading />

        <div className="flex">
          {pages.map(({ href, title }, index: number) => (
            <Link className="group mr-4" key={index} href={href}>
              <div className="text-white">{title}</div>
              <div className="h-[2px] w-[0%] rounded-full bg-pink-300 transition-all group-hover:w-full" />
            </Link>
          ))}
        </div>
      </div>
    </Container>
  </div>
);

export default DesktopNavbar;
