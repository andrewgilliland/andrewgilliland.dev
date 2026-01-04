import { useState } from "react";
import Diagram from "./Diagram";

const ProgrammingDiagram = () => {
  const [selectOption, setSelectOption] = useState("traditional-programming");
  const isTraditionalProgramming = selectOption === "traditional-programming";

  return (
    <div className="mt-48">
      <div className="flex  rounded-md mb-12">
        <label
          className={`${
            isTraditionalProgramming
              ? "bg-emerald-300 text-emerald-700 border-2 border-emerald-600"
              : "border-t-2 border-l-2 border-b-2 border-white"
          } flex-1 flex justify-center rounded-l-md p-2`}
        >
          <input
            className="hidden"
            type="radio"
            name="programming-type"
            value="traiditional-programming"
            checked={isTraditionalProgramming}
            onChange={() => {
              setSelectOption("traditional-programming");
            }}
          />
          <div className="font-semibold ml-4">Traditional Programming</div>
        </label>
        <label
          className={`${
            !isTraditionalProgramming
              ? "bg-emerald-300 text-emerald-700 border-emerald-600 border-l-2"
              : ""
          } flex-1 flex justify-center border-t-2 border-b-2 border-r-2 rounded-r-md p-2`}
        >
          <input
            className="hidden"
            type="radio"
            name="programming-type"
            value="machine-learning"
            checked={selectOption === "machine-learning"}
            onChange={() => {
              setSelectOption("machine-learning");
            }}
          />
          <div className="font-semibold ml-4">Machine Learning</div>
        </label>
      </div>

      <Diagram
        inputs={
          isTraditionalProgramming ? ["Rules", "Data"] : ["Data", "Answers"]
        }
        text={
          isTraditionalProgramming
            ? "Traditional Programming"
            : "Machine Learning"
        }
        outputs={isTraditionalProgramming ? ["Answers"] : ["Rules"]}
      />
    </div>
  );
};

export default ProgrammingDiagram;
