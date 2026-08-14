import { bind, play, set } from "@foleyjs/core";
import { useEffect } from "react";

export default function FoleyInit() {
  useEffect(() => {
    bind(document);
    set({
      theme: "soft",
      volume: 0.38,
      localize: 0.45,
    });

    const onPageLoad = () => {
      play("tick", { volume: 0.14 });
    };

    document.addEventListener("astro:page-load", onPageLoad);

    return () => {
      document.removeEventListener("astro:page-load", onPageLoad);
    };
  }, []);

  return null;
}
