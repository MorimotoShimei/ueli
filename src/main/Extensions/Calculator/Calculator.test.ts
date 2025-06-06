import { describe, expect, it } from "vitest";
import { Calculator } from "./Calculator";

describe(Calculator, () => {
    describe(Calculator.isValidExpression, () => {
        it("should return true when expression is a simple calculation", () => {
            expect(
                Calculator.isValidExpression({ expression: "1+1", argumentSeparator: ",", decimalSeparator: "." }),
            ).toBe(true);
        });

        it("should return true when expression is a more complicated calculation", () => {
            expect(
                Calculator.isValidExpression({
                    expression: "det([-1, 2; 3, 1])",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(true);

            expect(
                Calculator.isValidExpression({
                    expression: "sin(45 deg) ^ 2",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(true);
        });

        it("should return true when expression is a unit conversion", () => {
            expect(
                Calculator.isValidExpression({
                    expression: "1m in cm",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(true);
        });

        it("should return false when expression is not a calculation", () => {
            expect(
                Calculator.isValidExpression({
                    expression: "",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(false);

            expect(
                Calculator.isValidExpression({
                    expression: " ",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(false);

            expect(
                Calculator.isValidExpression({
                    expression: "abc",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(false);

            expect(
                Calculator.isValidExpression({
                    expression: "this is a random string",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(false);
        });

        it("should return false when expression matches a black list item", () => {
            expect(
                Calculator.isValidExpression({
                    expression: "i",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(false);

            expect(
                Calculator.isValidExpression({
                    expression: "version",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(false);

            expect(
                Calculator.isValidExpression({
                    expression: "abc",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(false);

            expect(
                Calculator.isValidExpression({
                    expression: "this is a random string",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(false);
        });

        it("should return false when expression is a calculation but the result is the same as the result", () => {
            expect(
                Calculator.isValidExpression({
                    expression: "100",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                }),
            ).toBe(false);
        });

        it("should return false when expression is an equation", () => {
            expect(
                Calculator.isValidExpression({
                    expression: "a = a + 3",
                    decimalSeparator: ".",
                    argumentSeparator: ",",
                }),
            ).toBe(false);
        });

        it("should return false when the result of the evaluation is a function", () => {
            expect(
                Calculator.isValidExpression({
                    expression: "f2(x, y) = x^y",
                    decimalSeparator: ".",
                    argumentSeparator: ",",
                }),
            ).toBe(false);
        });
    });

    describe(Calculator.calculate, () => {
        it("should return the result if the expression is a calculation", () => {
            expect(
                Calculator.calculate({
                    expression: "1.2 * (2 + 4.5)",
                    precision: 2,
                    decimalSeparator: ".",
                    argumentSeparator: ",",
                }),
            ).toBe("7.8");
        });

        it("should be able to handle different decimal and argument separators", () => {
            expect(
                Calculator.calculate({
                    expression: "1,3 * (2 + 4,5)",
                    precision: 3,
                    decimalSeparator: ",",
                    argumentSeparator: ";",
                }),
            ).toBe("8,45");

            expect(
                Calculator.calculate({
                    expression: "pow(2;4)",
                    precision: 2,
                    decimalSeparator: ".",
                    argumentSeparator: ";",
                }),
            ).toBe("16");
        });

        it("should throw an error if the expression can't be evaluated", () => {
            let errorCounter = 0;

            try {
                Calculator.calculate({
                    expression: "some string",
                    precision: 2,
                    decimalSeparator: ".",
                    argumentSeparator: ",",
                });
            } catch (error) {
                errorCounter++;
            }

            expect(errorCounter).toBe(1);
        });

        it("should fall back to a precision of 16 when the given precision is more than 64 or lower than 0", () => {
            expect(
                Calculator.calculate({
                    expression: "1/3",
                    precision: 65,
                    decimalSeparator: ".",
                    argumentSeparator: ",",
                }),
            ).toEqual("0.3333333333333333");

            expect(
                Calculator.calculate({
                    expression: "1/3",
                    precision: -1,
                    decimalSeparator: ".",
                    argumentSeparator: ",",
                }),
            ).toEqual("0.3333333333333333");
        });

        it("should to able to do unit conversion", () => {
            expect(
                Calculator.calculate({
                    expression: "1m in cm",
                    precision: 2,
                    decimalSeparator: ".",
                    argumentSeparator: ",",
                }),
            ).toEqual("100 cm");
        });

        it("should return 0.333 when evaluating the expression '1/3' and a precision of 3", () => {
            expect(
                Calculator.calculate({
                    expression: "1/3",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 3,
                }),
            ).toEqual("0.333");
        });

        it("should return 0.33333333 when evaluating the expression '1/3' and a precision of 8", () => {
            expect(
                Calculator.calculate({
                    expression: "1/3",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 8,
                }),
            ).toEqual("0.33333333");
        });

        it("should return 5035 when evaluating the expression '5050-15' and a precision of 4", () => {
            expect(
                Calculator.calculate({
                    expression: "5050-15",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 4,
                }),
            ).toEqual("5035");
        });

        it("should return 5035 when evaluating the expression '5050-15' and a precision of 1", () => {
            expect(
                Calculator.calculate({
                    expression: "5050-15",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 1,
                }),
            ).toEqual("5035");
        });

        it("should return 0.33 when evaluating the expression '(1000m in km)/3' and a precision of 2", () => {
            expect(
                Calculator.calculate({
                    expression: "(1000m in km)/3",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 2,
                }),
            ).toEqual("0.33 km");
        });

        it("should return 33.3333 when evaluating the expression '(100m^2 in m^2)/3' and a precision of 4", () => {
            expect(
                Calculator.calculate({
                    expression: "(100m^2 in m^2)/3",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 4,
                }),
            ).toEqual("33.3333 m^2");
        });

        it("should return 96.9 when evaluating 100-pi and a precision of 1", () => {
            expect(
                Calculator.calculate({
                    expression: "100-pi",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 1,
                }),
            ).toEqual("96.9");
        });

        it("should return 96.8584073464 when evaluating 100-pi and a precision of 3", () => {
            expect(
                Calculator.calculate({
                    expression: "100-pi",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 3,
                }),
            ).toEqual("96.858");
        });

        it("should return 96.8584073464 when evaluating 100-pi and a precision of 8", () => {
            expect(
                Calculator.calculate({
                    expression: "100-pi",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 8,
                }),
            ).toEqual("96.85840735");
        });

        it("should be able to do basic evaluation (taken from https://mathjs.org/docs/expressions/parsing.html#evaluate)", () => {
            expect(
                Calculator.calculate({
                    expression: "c = 2.3 + 4.5",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 4,
                }),
            ).toEqual("6.8");

            expect(
                Calculator.calculate({
                    expression: "sqrt(3^2 + 4^2)",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 4,
                }),
            ).toEqual("5");

            expect(
                Calculator.calculate({
                    expression: "sqrt(-4)",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 4,
                }),
            ).toEqual("2i");

            expect(
                Calculator.calculate({
                    expression: "2 inch to cm",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 4,
                }),
            ).toEqual("5.08 cm");

            expect(
                Calculator.calculate({
                    expression: "cos(45 deg)",
                    argumentSeparator: ",",
                    decimalSeparator: ".",
                    precision: 4,
                }),
            ).toEqual("0.7071");
        });
    });
});
