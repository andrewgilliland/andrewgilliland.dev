import ColorDivider from "@/components/ColorDivider";
import Image from "next/image";

export default function ProjectPage() {
  const title = "SmartScout";
  const description =
    "Precision Planting SmartScout is a mobile app that uses machine vision and augmented reality to automatically assess emergence and plant spacing in a 3D space. SmartScout is built with React Native and Swift for Native Modules, and deployed on iOS and iPadOS.";
  const link =
    "https://apps.apple.com/us/app/precision-planting-smartscout/id1672094173";
  const images = [
    "/projects/smartscout-1.webp",
    "/projects/smartscout-2.webp",
    "/projects/smartscout-3.webp",
    "/projects/smartscout-4.webp",
  ];
  const overview =
    "Precision Planting SmartScout in a mobile app that uses your camera video feed and infers plant emergence using a trained neural network model. ARKit is then used to determine spacing between plants. The app helps a user capture a story about planting and emergence health, including scoring and financial impact.";
  const features = [
    "Real-time plant emergence assessment",
    "Augmented reality visualization",
    "Automated plant spacing measurement",
    "Data-driven insights and reporting",
  ];
  const techStack = [
    "TypeScript",
    "React Native",
    "Swift",
    "SwiftUI",
    "ARKit",
    "CoreML",
    "AWS",
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
          href={link}
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
