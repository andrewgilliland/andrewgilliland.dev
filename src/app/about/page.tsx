import Image from "next/image";
import Link from "next/link";
import Block from "@/components/Block";

const AboutPage = () => {
  const images = [
    { src: "/hannah-andrew-1.jpeg", alt: "Hannah and Andrew" },
    { src: "/hank-kitchen-1.jpeg", alt: "Hank the Dog" },
    { src: "/gus-christmas-1.jpeg", alt: "Gus the Cat" },
    { src: "/bernie-kitchen-1.jpeg", alt: "Bernie in Cat" },
  ];

  return (
    <div>
      <section className="mx-auto mb-10 mt-20 max-w-[60ch]">
        <h1 className="stroke-white text-3xl font-bold capitalize text-gray-100 md:text-4xl">
          About
        </h1>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {images.map((image) => (
            <Image
              className="border-2 border-white object-cover"
              key={image.src}
              src={image.src}
              width={200}
              height={250}
              alt={image.alt}
            />
          ))}
        </div>

        <div className="mt-10 grid gap-4 text-base text-white sm:gap-8">
          <p>
            Andrew is a community-taught full stack developer with a passion for
            continuous learning, strategic thinking, and thoughtful
            collaboration. He thrives in environments where he can explore new
            ideas, tackle complex challenges, and refine processes for lasting
            impact. In his spare time he helps organize meetups for{" "}
            <a
              className="text-emerald-400 hover:underline"
              href="https://www.blono.dev/"
            >
              Bloomington-Normal Developers
            </a>
            .
          </p>

          <p>
            Outside of software development, he enjoys fitness, nutrition,
            reading, drawing, grilling, woodworking, and tackling various home
            projects. When it&apos;s time to relax, you&apos;ll find him hanging
            out with his girlfriend Hannah, dog Hank, and cats Gus and Bernie,
            enjoying some Yacht Rock.
          </p>
        </div>

        <div className="mt-10 text-white">
          <h3 className="bg-white px-2 py-1 font-bold text-black">
            Technologies
          </h3>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 font-mono text-sm sm:justify-between">
            <ul>
              <li>HTML5</li>
              <li>CSS3</li>
              <li>JavaScript</li>
              <li>React</li>
              <li>Node.js</li>
            </ul>
            <ul>
              <li>Astro</li>
              <li>Next.js</li>
              <li>React Native</li>
              <li>Expo</li>
              <li>Bun</li>
            </ul>
            <ul>
              <li>AWS</li>
              <li>Vercel</li>
              <li>Cloudflare</li>
              <li>Netlify</li>
              <li>Fly.io</li>
            </ul>
            <ul>
              <li>MySQL</li>
              <li>PostgreSQL</li>
              <li>SQLite</li>
              <li>DynamoDB</li>
              <li>MongoDB</li>
            </ul>
            <ul>
              <li>Swift</li>
              <li>UIKit</li>
              <li>SwiftUI</li>
              <li>CoreML</li>
              <li>ARKit</li>
              <li>RealityKit</li>
            </ul>
          </div>

          <Link href="/resume">
            <Block
              className="mt-8 inline-block"
              backgroundColor="bg-pink-500"
              height="12"
              width="24"
              theme="dark"
            >
              Resume
            </Block>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
