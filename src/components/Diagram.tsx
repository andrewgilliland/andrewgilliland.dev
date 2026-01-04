type DiagramProps = {
  inputs: string[];
  text: string;
  outputs: string[];
};

const Diagram = ({ inputs, text, outputs }: DiagramProps) => (
  <div className="flex justify-stretch w-full">
    <div className="flex-1 flex flex-col justify-around">
      {inputs.map((input, index) => (
        <div key={index} className="flex items-center">
          <div className="mr-2">{input}</div>
          <div className="h-0.5 w-full bg-white" />
        </div>
      ))}
    </div>
    <div className="flex-1 flex justify-center items-center font-semibold bg-red-500 border-2 border-white rounded-md p-6">
      {text}
    </div>
    <div className="flex-1 flex flex-col justify-center">
      {outputs.map((output, index) => (
        <div key={index} className="flex items-center">
          <div className="h-0.5 w-full bg-white" />
          <div className="ml-2">{output}</div>
        </div>
      ))}
    </div>
  </div>
);

export default Diagram;
