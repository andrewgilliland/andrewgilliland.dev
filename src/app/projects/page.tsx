import Link from "next/link";

export default function ProjectsPage() {
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

      <section className="mx-auto mt-20 max-w-[60ch]">
        <ul className="space-y-6">
          <li className="rounded-lg border p-4 transition">
            <Link
              className="text-xl font-semibold text-blue-600 hover:underline"
              href="/projects/project-1"
            >
              SmartScout
            </Link>
            <p className="mt-2 text-gray-300">
              A brief description of Project One.
            </p>
          </li>
          <li className="rounded-lg border p-4 transition hover:shadow-lg">
            <Link
              className="text-xl font-semibold text-blue-600 hover:underline"
              href="/projects/project-2"
            >
              blono.dev
            </Link>
            <p className="mt-2 text-gray-300">
              A brief description of blono.dev.
            </p>
          </li>
          {/* Add more projects as needed */}
        </ul>
      </section>
    </div>
  );
}
