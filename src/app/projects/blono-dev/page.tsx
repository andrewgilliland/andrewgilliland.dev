import ColorDivider from "@/components/ColorDivider";
import Image from "next/image";

export default function ProjectPage() {
  const title = "blono.dev";
  const description =
    "blono.dev is a website for Bloomington-Normal Developers, a local developer community in Central Illinois. Built with Next.js and Tailwind CSS.";

  const images = ["/projects/blono-dev-1.png"];
  const link = "https://blono.dev";

  const overview =
    "blono.dev is a website for Bloomington-Normal Developers, a local developer community in Central Illinois. It serves as a hub for sharing resources, collaborating on projects, and fostering connections among developers in the area. The site is built with Next.js and Tailwind CSS, ensuring a modern and responsive design.";

  const features = [
    "Resource sharing and collaboration",
    "Event announcements and meetups",
    "Project showcases and portfolios",
    "Community forums and discussions",
  ];

  const techStack = [
    "TypeScript",
    "React",
    "Next.js",
    "Tailwind CSS",
    "Vercel",
  ];

  return (
    <div className="px-8">
      <section className="mx-auto mt-20 max-w-[60ch]">
        <h1 className="stroke-white text-3xl font-bold text-gray-100 md:text-4xl">
          {title}
        </h1>
        <p className="mt-10 text-gray-300">{description}</p>
        <ColorDivider />
      </section>

      <section className="mx-auto mt-10 max-w-[60ch]">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={link}
          className="w-full"
        >
          {images.map((src, index) => (
            <Image
              key={index}
              src={src}
              alt={`SmartScout ${index + 1}`}
              width={800}
              height={300}
            />
          ))}
        </a>
      </section>
      <section className="mx-auto mt-10 max-w-[60ch]">
        <h2 className="text-2xl font-bold text-gray-100">Overview</h2>
        <p className="mt-4 text-gray-300">{overview}</p>
      </section>
      <section className="mx-auto mt-10 max-w-[60ch]">
        <h2 className="text-2xl font-bold text-gray-100">Features</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-300">
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </section>
      <section className="mx-auto mt-10 max-w-[60ch]">
        <h2 className="text-2xl font-bold text-gray-100">Tech Stack</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-300">
          {techStack.map((tech, index) => (
            <li key={index}>{tech}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
