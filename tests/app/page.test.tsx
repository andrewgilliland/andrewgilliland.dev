import { expect } from "@jest/globals";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("should be truthy", () => {
    expect(true).toBeTruthy();
  });

  // it("should render", async () => {
  //   const homePage = await renderToString(<HomePage />);

  //   // Arrange
  //   render(homePage);
  // });
});
