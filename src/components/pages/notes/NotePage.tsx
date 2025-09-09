import { FC } from "react";
import ColorDivider from "../../ColorDivider";
import { transformMarkdown } from "@/lib/actions/markdown";

type NotePageProps = {
  pagePath: string;
};

const NotePage: FC<NotePageProps> = async ({ pagePath }) => {
  const { frontmatter, html } = await transformMarkdown(pagePath);
  const { title, excerpt, date } = frontmatter;

  const formattedDate = new Date(date).toLocaleDateString("en-us", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto mt-12 min-h-screen px-[10%] md:w-[40em] md:p-0">
      <div>
        <h1 className="mt-8 text-4xl text-white md:text-5xl lg:text-7xl">
          {title}
        </h1>
        <div className="mt-2 text-xl text-gray-200">{excerpt}</div>
        <div className="mt-2 text-sm text-gray-400">
          Last Updated: {formattedDate}
        </div>
        <ColorDivider />
      </div>

      <div
        className="prose my-20 grid max-w-2xl prose-h2:text-yellow-300 prose-h3:text-purple-400 prose-h4:text-emerald-400 prose-h5:text-gray-500 prose-p:text-gray-200 prose-a:font-semibold prose-a:text-cyan-300 prose-a:no-underline prose-strong:bg-emerald-950 prose-strong:font-mono prose-strong:text-emerald-400 prose-em:font-semibold prose-em:text-yellow-300 prose-code:grid prose-pre:border-2 prose-pre:border-white prose-ol:text-gray-200 prose-ul:text-gray-200 prose-pre:md:py-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default NotePage;
