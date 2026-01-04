type ContainerProps = {
  children: React.ReactNode;
};

const Container = ({ children }: ContainerProps) => (
  <div className="max-w-6xl mx-auto">{children}</div>
);

export default Container;
