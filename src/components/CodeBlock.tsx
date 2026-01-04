import { FC } from "react";
import { codeToHtml } from "shiki";

type CodeBlockProps = {
  code: string;
};

const CodeBlock: FC<CodeBlockProps> = async ({ code }) => {
  const out = await codeToHtml(code, {
    lang: "ts",
    theme: "synthwave-84",
  });

  return (
    <div
      className="prose
                 prose-pre:border-2 prose-pre:border-white prose-pre:md:py-6
                 prose-code:grid"
      dangerouslySetInnerHTML={{ __html: out }}
    />
  );
};

export default CodeBlock;
