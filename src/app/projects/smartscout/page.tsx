import ColorDivider from "@/components/ColorDivider";
import Image from "next/image";

export default function ProjectPage() {
  const title = "SmartScout";
  const description =
    "Precision Planting SmartScout is a mobile app that uses machine vision and augmented reality to automatically assess emergence and plant spacing in a 3D space. SmartScout is built with React Native and Swift for Native Modules, and deployed on iOS and iPadOS.";

  const images = [
    "/projects/smartscout-1.webp",
    "/projects/smartscout-2.webp",
    "/projects/smartscout-3.webp",
    "/projects/smartscout-4.webp",
  ];

  return (
    <div className="px-8">
      <section className="mx-auto mt-20 max-w-[60ch]">
        <h1 className="stroke-white text-3xl font-bold capitalize text-gray-100 md:text-4xl">
          {title}
        </h1>
        <p className="mt-10 text-gray-300">{description}</p>
        <ColorDivider />
      </section>

      <section className="mx-auto mt-10 max-w-[60ch]">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://apps.apple.com/us/app/precision-planting-smartscout/id1672094173"
          className="grid grid-cols-4 gap-2"
        >
          {images.map((src, index) => (
            <Image
              key={index}
              src={src}
              alt={`SmartScout ${index + 1}`}
              width={500}
              height={300}
            />
          ))}
        </a>
      </section>
      <section className="mx-auto mt-10 max-w-[60ch]">
        <h2 className="text-2xl font-bold text-gray-100">Overview</h2>
        <p className="mt-4 text-gray-300">
          Precision Planting SmartScout in a mobile app that uses your camera
          video feed and infers plant emergence using a trained neural network
          model. ARKit is then used to determine spacing between plants. The app
          helps a user capture a story about planting and emergence health,
          including scoring and financial impact.
        </p>
      </section>
      <section className="mx-auto mt-10 max-w-[60ch]">
        <h2 className="text-2xl font-bold text-gray-100">Features</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-300">
          <li>Real-time plant emergence assessment</li>
          <li>Augmented reality visualization</li>
          <li>Automated plant spacing measurement</li>
          <li>Data-driven insights and reporting</li>
        </ul>
      </section>
      <section className="mx-auto mt-10 max-w-[60ch]">
        <h2 className="text-2xl font-bold text-gray-100">Tech Stack</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-300">
          <li>TypeScript</li>
          <li>React Native</li>
          <li>Swift</li>
          <li>SwiftUI</li>
          <li>ARKit</li>
          <li>CoreML</li>
          <li>AWS</li>
        </ul>
      </section>
    </div>
  );
}
