import { useEffect, useState } from "react";
import OpenClose from "./OpenClose";
import type { Page } from "@/types";

type MobileNavbarProps = {
  pages: Page[];
};

const MobileNavbar = ({ pages }: MobileNavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentPath]);

  const activePageTitle = pages.find(
    (page) => page.href === currentPath,
  )?.title;

  return (
    <>
      <div className="border-white-300 fixed z-40 flex w-full items-center justify-between border-b-2 bg-black px-[10%] py-6 md:hidden">
        <a href="/" aria-label="Andrew Gilliland - Home">
          <span
            className="header-heading text-2xl font-bold md:text-3xl"
            style={{
              backgroundImage: `linear-gradient(to bottom right, #f9a8d4, #f9a8d4 30%, #6ee7b7 30%, #6ee7b7 50%, #fde047 50%, #fde047 70%, #67e8f9 70%, #67e8f9)`,
            }}
          >
            Andrew Gilliland
          </span>
        </a>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
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
            <a className="group" key={index} href={href}>
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
            </a>
          ))}
        </div>
        <div />
      </div>
    </>
  );
};

export default MobileNavbar;
