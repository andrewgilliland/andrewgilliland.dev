import Image from "next/image";
import Link from "next/link";
import Block from "@/components/Block";

const AboutPage = () => {
  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden bg-black">
      <div className="relative px-8 py-14">
        <h1 className="stroke-black text-3xl font-bold text-white md:mx-0 md:text-4xl">
          About
        </h1>

        <section className="mt-10">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Image
              src="/hannah-andrew-1.jpeg"
              width={1200}
              height={500}
              alt="Andrew Gilliland"
              className="rounded border-2 border-white bg-purple-700 object-cover"
            />
            <Image
              src="/hank-kitchen-1.jpeg"
              width={800}
              height={500}
              alt="Hank the Dog"
              className="rounded border-2 border-white object-cover"
            />
            <Image
              src="/gus-christmas-1.jpeg"
              width={800}
              height={500}
              alt="Gus the Cat"
              className="rounded border-2 border-white object-cover"
            />
            <Image
              src="/bernie-kitchen-1.jpeg"
              width={800}
              height={500}
              alt="Bernie in Cat"
              className="rounded border-2 border-white bg-purple-700 object-cover"
            />
          </div>

          <div className="mt-10 grid gap-4 text-base font-semibold text-white sm:gap-8">
            <p>
              Andrew is a community-taught full stack developer with a passion
              for continuous learning, strategic thinking, and thoughtful
              collaboration. He thrives in environments where he can explore new
              ideas, tackle complex challenges, and refine processes for lasting
              impact. Whether mentoring teammates, evaluating technical
              solutions, or building from scratch, he brings a reflective
              mindset and commitment to helping both people and systems grow
              together.
            </p>

            <p>
              I thrive on building engaging and interactive user experiences and
              am comfortable working in both front-end and back-end development.
              For mobile applications, I enjoy working in TypeScript, Swift,
              React Native, and Expo. For web applications, my go-to tools are
              TypeScript, React, Next.js, and Astro. I&apos;m always eager to
              learn and work with new technologies.
            </p>

            <p>
              Outside of programming, I love fitness, exercise, and nutrition.
              Having worked as a personal trainer for several years, I
              thoroughly enjoy sharing my knowledge with others. My other
              interests include woodworking, reading, drawing, grilling, and
              tackling various home projects. When it&apos;s time to relax,
              you&apos;ll find me hanging out with my dog Hank, my cats Gus and
              Bernie, while enjoying some Yacht Rock.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 rounded-lg bg-black p-4 text-white">
            <h3 className="rounded-lg border-2 border-black bg-white px-2 py-1 font-bold text-black">
              Technologies
            </h3>
            <div className="flex list-disc gap-2 text-sm font-semibold">
              <ul className="min-w-fit">
                <li>HTML5</li>
                <li>CSS3</li>
                <li>JavaScript</li>
                <li>React</li>
                <li>Next.js</li>
                <li>Astro</li>
                <li>React Native</li>
                <li>Expo</li>
                <li>Node.js</li>
                <li>Bun</li>
              </ul>
              <ul className="">
                <li>AWS</li>
                <li>Vercel</li>
                <li>Fly.io</li>
                <li>Netlify</li>
                <li>MySQL</li>
                <li>PostgreSQL</li>
                <li>SQLite</li>
                <li>DynamoDB</li>
                <li>MongoDB</li>
              </ul>
              <ul className="">
                <li>Swift</li>
                <li>UIKit</li>
                <li>SwiftUI</li>
                <li>CoreML</li>
                <li>ARKit</li>
                <li>RealityKit</li>
              </ul>
            </div>

            <Link className="mt-4" href="/resume">
              <Block
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
    </div>
  );
};

export default AboutPage;
