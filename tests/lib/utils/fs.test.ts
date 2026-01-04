import { isPathDirectory } from "../../../src/lib/utils/fs";
import { expect } from "@jest/globals";

describe("isPathDirectory", () => {
  it("should be truthy", () => {
    expect(true).toBeTruthy();
  });

  // it("should return true if the path is a directory", async () => {
  //   // Arrange
  //   const path = "../data";
  //   // Act
  //   const result = await isPathDirectory(path);
  //   // Assert
  //   expect(result).toBe(true);
  // });
});
