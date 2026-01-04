"use client";
import { useEffect, useState } from "react";
import HeaderHeading from "./HeaderHeading";
import Link from "next/link";
import { Page } from "@/types";
import { usePathname } from "next/navigation";
import OpenClose from "./svg/OpenClose";

type MobileNavbarProps = {
  pages: Page[];
};

const MobileNavbar = ({ pages }: MobileNavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const activePageTitle = pages.find((page) => page.href === pathname)?.title;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="border-white-300 fixed z-40 flex w-full items-center justify-between border-b-2 bg-black px-[10%] py-6 md:hidden">
        <HeaderHeading />
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <OpenClose isOpen={isMenuOpen} />
        </button>
      </div>

      <div
        className={`${
          isMenuOpen ? "translate-y-0" : "-translate-y-full"
        } border-white-300 fixed left-0 right-0 top-0 z-30 flex-col rounded-b-lg border-x-2 border-b-2 bg-black px-[10%] pt-[82px] transition-all duration-300 md:hidden`}
      >
        <div className="my-10 flex h-full flex-col items-center gap-10">
          {pages.map(({ href, title }, index) => (
            <Link className="group" key={index} href={href}>
              <div
                className={`rounded-md px-2 py-1 text-3xl ${
                  activePageTitle === title
                    ? "bg-pink-300 font-semibold text-black"
                    : "text-white"
                }`}
              >
                {title}
              </div>
              <div
                className={`h-0.5 w-[0%] bg-pink-300 ${
                  activePageTitle !== title && "group-hover:w-full"
                } transition-all`}
              />
            </Link>
          ))}
        </div>
        <div />
      </div>
    </>
  );
};

export default MobileNavbar;
