import Image from "next/image";
import Link from "next/link";

export default function ProjectsPage() {
  const projects = [
    {
      title: "SmartScout",
      description:
        "Precision Planting SmartScout is an app that uses machine vision and augmented reality to automatically assess emergence and plant spacing in a 3D space.",
      href: "/projects/smartscout",
      logo: "/projects/smartscout-icon-1.webp",
    },
    {
      title: "blono.dev",
      description:
        "Website for Bloomington-Normal Developers. Built with Next.js and Tailwind CSS.",
      href: "/projects/blono-dev",
      logo: "/projects/blono-dev-icon-1.svg",
    },
  ];

  return (
    <div className="px-8">
      <section className="mx-auto mt-20 max-w-[60ch]">
        <h1 className="stroke-white text-3xl font-bold capitalize text-gray-100 md:text-4xl">
          My Projects
        </h1>
        <p className="mt-10 text-gray-300">
          Explore some of the work I've built and contributed to.
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-[60ch]">
        <div className="grid gap-3">
          {projects.map(({ href, title, description, logo }) => (
            <Link
              key={title}
              className="group relative min-w-[240px]"
              href={href}
              title={title}
            >
              <div className="absolute bottom-0 h-full w-full rounded border-2 border-white bg-black" />
              <div className="transform-gpu rounded border-2 border-white bg-black p-4 transition group-hover:-translate-x-1 group-hover:-translate-y-1">
                {logo && (
                  <Image
                    src={logo}
                    alt={`${title} logo`}
                    className="mb-4 h-12 w-12 rounded-sm object-contain"
                    width={48}
                    height={48}
                  />
                )}
                <h4 className="font-bold text-white">{title}</h4>
                <p className="mt-2 text-gray-300">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
