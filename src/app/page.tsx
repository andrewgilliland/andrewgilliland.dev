import Link from "next/link";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { getNotes } from "@/lib/actions/notes";
import TopicCard from "@/components/TopicCard";
import CenteredSection from "@/components/sections/CenteredSection";
import TwinSections from "@/components/sections/TwinSections";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";

//* Design Inspiration
// https://howdy.com/
// https://gumroad.com/
// https://salehmubashar.com/
// https://www.hover.dev/

const HomePage = async () => {
  const { notes } = await getNotes();
  const notesSlice = notes.slice(0, 5);

  const topics = [
    {
      name: "JavaScript",
      path: "./notes/javascript",
      color: "yellow",
    },
    {
      name: "React Native",
      path: "./notes/javascript/react/react-native",
      color: "cyan",
    },
    {
      name: "Expo",
      path: "./notes/javascript/react/react-native/expo",
      color: "pink",
    },
  ];

  return (
    <div className="relative">
      <div>
        <TwinSections>
          <TwinSections.SectionOne>
            <div className="mx-auto max-w-xl">
              <h1 className="stroke-black text-4xl font-bold text-white md:text-6xl">
                Howdy, I&apos;m Andrew!
              </h1>
              <p className="mt-8 text-xl text-black md:mt-12">
                I am a community taught full stack developer. This site is to
                share what I am learning and hopefully help others along the
                way.
              </p>
              <PrimaryButton
                href="/notes"
                className="mt-12"
                text="Read Notes"
              />
            </div>
          </TwinSections.SectionOne>
          <TwinSections.SectionTwo>
            <div>
              <h2 className="stroke-black text-center text-4xl font-bold text-white">
                Notes
              </h2>

              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-black">
                    Some topics to explore:
                  </h2>
                </div>
                <div className="mt-6 grid w-60 gap-4">
                  {topics.map((topic, index) => (
                    <TopicCard topic={topic} key={index} />
                  ))}
                </div>
              </div>
            </div>
          </TwinSections.SectionTwo>
        </TwinSections>
        <CenteredSection>
          <h2 className="mb-12 stroke-white text-center text-4xl font-bold text-black">
            Recent Notes
          </h2>
          <div className="flex flex-col items-center">
            {notesSlice.map(({ path, frontmatter }, index) => (
              <Link
                key={index}
                className={`${
                  index && "mt-4"
                } group relative w-1/2 min-w-[240px]`}
                href={`${path!}`}
                title={frontmatter!.title}
              >
                <div className="absolute bottom-0 h-full w-full rounded border-2 border-white bg-black" />
                <div className="flex transform-gpu rounded border-2 border-white bg-black p-4 transition group-hover:-translate-x-1 group-hover:-translate-y-1">
                  <PencilSquareIcon className="h-6 w-6 stroke-white stroke-2" />
                  <h4 className="ml-2 truncate font-bold text-white">
                    {frontmatter!.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </CenteredSection>
      </div>
    </div>
  );
};

export default HomePage;
