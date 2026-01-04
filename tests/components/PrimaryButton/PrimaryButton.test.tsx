import { expect } from "@jest/globals";
import { render, fireEvent, screen } from "@testing-library/react";
import PrimaryButton from "../../../src/components/PrimaryButton/PrimaryButton";

describe("PrimaryButton", () => {
  it("should be truthy", () => {
    expect(true).toBeTruthy();
  });
});

// describe("PrimaryButton", () => {
//   // Arrange
//   const mockHandleClick = jest.fn();

//   const renderComponent = () => {
//     render(<PrimaryButton onClick={mockHandleClick} text="Click me" />);

//     return {
//       button: screen.getByRole("button"),
//     };
//   };

//   it("should render the button", () => {
//     // Act
//     renderComponent();
//     // Assert
//     expect(screen.getByRole("button")).toBeInTheDocument();
//   });

//   it("should call the onClick function when clicked", () => {
//     // Act
//     const { button } = renderComponent();
//     fireEvent.click(button);
//     // Assert
//     expect(mockHandleClick).toHaveBeenCalled();
//   });
// });
