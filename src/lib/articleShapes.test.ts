import { describe, expect, it } from "vitest";
import colors from "tailwindcss/colors";
import { articleShapes } from "./articleShapes";
import { NEON } from "./neonPalette";

const shapesOf = (slug: string) => articleShapes(slug, { tone: "dark" }).shapes;

describe("articleShapes", () => {
  it("returns the same shapes for the same article", () => {
    expect(shapesOf("intro-to-sqs")).toEqual(shapesOf("intro-to-sqs"));
  });

  it("returns different shapes for different articles", () => {
    expect(shapesOf("intro-to-sqs")).not.toEqual(
      shapesOf("intro-to-amazon-ecs"),
    );
  });

  it("draws four shapes, one in each accent colour", () => {
    const shapes = shapesOf("intro-to-aws-lambda");
    expect(shapes).toHaveLength(4);
    expect(shapes.map((s) => s.fill).sort()).toEqual(
      [NEON.pink, NEON.cyan, NEON.emerald, NEON.yellow].sort(),
    );
  });

  it("scatters each shape a small distance on hover and focus", () => {
    for (const { style } of shapesOf("intro-to-aws-lambda")) {
      const distance = Math.hypot(
        parseFloat(style["--dx"]),
        parseFloat(style["--dy"]),
      );
      expect(distance).toBeGreaterThanOrEqual(2.9);
      expect(distance).toBeLessThanOrEqual(8.1);
    }
  });

  it("outlines the shapes in the tone's colour", () => {
    const strokes = (tone: "dark" | "light") =>
      new Set(
        articleShapes("intro-to-sqs", { tone }).shapes.map((s) => s.stroke),
      );
    expect(strokes("dark")).toEqual(new Set([colors.black]));
    expect(strokes("light")).toEqual(new Set([colors.white]));
  });

  it("drifts only when asked", () => {
    expect(articleShapes("intro-to-sqs", { tone: "dark" }).className).toBe(
      "article-shapes",
    );
    expect(
      articleShapes("intro-to-sqs", { tone: "dark", drift: true }).className,
    ).toBe("article-shapes article-shapes--drift");
  });
});

describe("articleShapes pinned output", () => {
  // Changing seeding, the PRNG or the order of random draws reshuffles every
  // article's shapes. These pins catch that.
  it("draws intro-to-sqs's shapes", () => {
    expect(shapesOf("intro-to-sqs")).toMatchInlineSnapshot(`
      [
        {
          "attrs": {
            "cx": 106.08724119095132,
            "cy": 107.78295850288123,
            "r": 60.68307329737581,
          },
          "fill": "#6ee7b7",
          "stroke": "#000",
          "style": {
            "--dx": "6.6px",
            "--dy": "0.4px",
            "--float-delay": "0s",
            "--float-duration": "5s",
            "--fx": "-0.3px",
            "--fy": "3.9px",
          },
          "tag": "circle",
        },
        {
          "attrs": {
            "d": "M 71.5 27.7 Q 66.6 19.2 61.7 27.7 L 29.0 84.3 Q 24.1 92.8 33.9 92.8 L 99.2 92.8 Q 109.1 92.8 104.2 84.3 Z",
            "transform": "rotate(15.108505493262783 66.58262716792524 68.25343444757164)",
          },
          "fill": "#fde047",
          "stroke": "#000",
          "style": {
            "--dx": "1.2px",
            "--dy": "5.1px",
            "--float-delay": "-1.7s",
            "--float-duration": "6.3s",
            "--fx": "-3.0px",
            "--fy": "0.7px",
          },
          "tag": "path",
        },
        {
          "attrs": {
            "d": "M 67.8 18.4 Q 72.3 13.9 76.8 18.4 L 99.5 41.1 Q 104.0 45.6 99.5 50.1 L 76.8 72.8 Q 72.3 77.3 67.8 72.8 L 45.1 50.1 Q 40.6 45.6 45.1 41.1 Z",
            "transform": "rotate(31.03475753800012 72.31315363012254 45.57196547323838)",
          },
          "fill": "#67e8f9",
          "stroke": "#000",
          "style": {
            "--dx": "-3.5px",
            "--dy": "-0.9px",
            "--float-delay": "-3.4s",
            "--float-duration": "7.6s",
            "--fx": "0.5px",
            "--fy": "-2.1px",
          },
          "tag": "path",
        },
        {
          "attrs": {
            "d": "M 48.0 17.7 Q 45.4 13.2 42.8 17.7 L 25.6 47.6 Q 23.0 52.1 28.2 52.1 L 62.7 52.1 Q 67.9 52.1 65.3 47.6 Z",
            "transform": "rotate(2.142238011583686 45.42805318022147 39.14348416030407)",
          },
          "fill": "#ec4899",
          "stroke": "#000",
          "style": {
            "--dx": "3.6px",
            "--dy": "-4.7px",
            "--float-delay": "-5.1s",
            "--float-duration": "8.9s",
            "--fx": "2.8px",
            "--fy": "2.2px",
          },
          "tag": "path",
        },
      ]
    `);
  });

  it("draws intro-to-aws-lambda's shapes", () => {
    expect(shapesOf("intro-to-aws-lambda")).toMatchInlineSnapshot(`
      [
        {
          "attrs": {
            "height": 121.36342084174976,
            "rx": 12.136342084174977,
            "transform": "rotate(34.4428640732076 80.23347854148597 76.90028606308624)",
            "width": 121.36342084174976,
            "x": 19.551768120611086,
            "y": 16.218575642211363,
          },
          "fill": "#fde047",
          "stroke": "#000",
          "style": {
            "--dx": "2.7px",
            "--dy": "2.8px",
            "--float-delay": "0s",
            "--float-duration": "5s",
            "--fx": "-1.7px",
            "--fy": "1.6px",
          },
          "tag": "rect",
        },
        {
          "attrs": {
            "d": "M 52.0 36.4 Q 46.6 27.1 41.3 36.4 L 5.5 98.4 Q 0.2 107.7 10.9 107.7 L 82.4 107.7 Q 93.1 107.7 87.8 98.4 Z",
            "transform": "rotate(1.9624312687665224 46.64165497943759 80.82046802341938)",
          },
          "fill": "#6ee7b7",
          "stroke": "#000",
          "style": {
            "--dx": "4.7px",
            "--dy": "3.4px",
            "--float-delay": "-1.7s",
            "--float-duration": "6.3s",
            "--fx": "-2.0px",
            "--fy": "2.8px",
          },
          "tag": "path",
        },
        {
          "attrs": {
            "d": "M 73.5 38.0 Q 70.3 32.4 67.1 38.0 L 45.8 74.9 Q 42.6 80.4 49.0 80.4 L 91.6 80.4 Q 98.0 80.4 94.8 74.9 Z",
            "transform": "rotate(28.063778107753024 70.33309960830957 64.40196357434615)",
          },
          "fill": "#67e8f9",
          "stroke": "#000",
          "style": {
            "--dx": "-3.1px",
            "--dy": "-7.3px",
            "--float-delay": "-3.4s",
            "--float-duration": "7.6s",
            "--fx": "4.4px",
            "--fy": "-1.8px",
          },
          "tag": "path",
        },
        {
          "attrs": {
            "d": "M 29.7 20.6 Q 32.6 17.7 35.5 20.6 L 50.3 35.3 Q 53.2 38.2 50.3 41.1 L 35.5 55.9 Q 32.6 58.8 29.7 55.9 L 15.0 41.1 Q 12.1 38.2 15.0 35.3 Z",
            "transform": "rotate(28.97092732717283 32.61583485873416 38.2202106192708)",
          },
          "fill": "#ec4899",
          "stroke": "#000",
          "style": {
            "--dx": "-2.8px",
            "--dy": "-6.3px",
            "--float-delay": "-5.1s",
            "--float-duration": "8.9s",
            "--fx": "3.8px",
            "--fy": "-1.7px",
          },
          "tag": "path",
        },
      ]
    `);
  });
});
