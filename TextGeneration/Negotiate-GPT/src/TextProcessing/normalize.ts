import wordsToNumbers from "words-to-numbers";

/**
 * This pattern will match:
 * - beginning or space
 * - optional: dollar sign
 * - one or more digits
 * - optional: comma + three digits (repeating)
 * - optional: period + one or more digits
 * - optional: `k` used to denote thousands
 * - end or space
 */
// const NUMBER = /(?<=^|\s)\$?(\d+(?:,\d{3})*(?:\.\d+)?)(k?)(?=$|\W+|\s)/g;
// const NUMBER = /(?<=^|\s)\${0,2}(\d+(?:[,.'";:-]{0,2}\d{3})*(?:\.\d+)?)(k?)(?=$|\W+|\s)\${0,2}/g;
const NUMBER = /(?<=^|\s)\${0,2}(\d+(?:[,'";:-]{0,2}\d{0,3})*(?:\.\d+)?)(k?)(?=$|\W+|\s)\${0,2}/g;

function convertWordsToNumbers(input: string): string {
  const result = wordsToNumbers(input.replace(/\ba\b/g, "___a___")) ?? "";
  return result.toString().replace(/\b___a___\b/g, "a");
}

/**
 * Normalize a message
 */
export function normalize(input: string): string {
  return convertWordsToNumbers(input)
    .replace(NUMBER, (_match, value, isThousand) => {
      let number = value.replace(/[,'";:-]{0,2}/g, "");
      if (isThousand) number += "000";
      return number;
    })
    .replace(/\b(\d+)\s+dollars\s+and\s+(\d+)\s+cents\b/g, "$1.$2")
    .replace(/\b(\d+)\s+dollars\b/, "$1")
    .replace(/\b(\d+)\s+cents\b/g, "0.$1");
}