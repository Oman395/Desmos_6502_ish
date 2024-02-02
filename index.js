import fs from "fs";
import { TABLE } from "./table.js";

const SPLIT_NEWLINE_REGEXP = /[\n\r]+/gm;
const START_WHITESPACE_REMOVE_REGEXP = /^\s+/gm;
const INST_EXTRACT_REGEXP = /^\S+/gm;
const ARG_EXTRACT_REGEXP = /(?<=[ ,])[^,\s]+/gm;
const COMMENT_REMOVE_REGEXP = /#[^\n]+/gm;
const REGISTERS = ["A", "B", "X", "Y"];
const ARG_TYPES = {
  CONSTANT: "C",
  ADDRESS: "A",
  REGISTER: "R",
  LABEL: "L"
};

let labels = {}; // This needs to be *very* global lol

function getArgType(arg) {
  if (!isNaN(parseInt(arg))) return ARG_TYPES.CONSTANT;
  if (arg.startsWith("$")) return ARG_TYPES.ADDRESS;
  if (REGISTERS.includes(arg.toUpperCase())) return ARG_TYPES.REGISTER;
  return ARG_TYPES.LABEL;
}

function isComment(instruction) {
  return instruction.startsWith("#");
}

function isLabel(instruction) {
  return instruction.endsWith(":");
}

function parseArguments(args) {
  let types = args.map((arg) => getArgType(arg));
  types = types.map((type, i) => {
    // Labels need to be converted to addresses
    if (type === ARG_TYPES.LABEL) {
      args[i] = `$${labels[args[i]]}`;
      return ARG_TYPES.ADDRESS;
    }
    return type;
  });
  // Arguments need to be converted to their number forms
  args = args.map((arg, i) => {
    switch (types[i]) {
      case ARG_TYPES.CONSTANT:
        return parseInt(arg);
      case ARG_TYPES.ADDRESS:
        // Addresses start with $, which we need to trim.
        return parseInt(arg.slice(1, arg.length));
      case ARG_TYPES.REGISTER:
        // Because of an oversight in development, the registers go from 1 to 4, not 0 to 3; we need to correct for this.
        return REGISTERS.indexOf(arg) + 1;
    }
  });
  return [args, types];
}

const file = process.argv[2];
if (file === undefined) throw new Error("No file specified");
if (!fs.existsSync(file)) throw new Error(`File ${file} does not exist`);

const data = fs.readFileSync(process.argv[2]).toString();

// Format the data so it's easier to parse
const data_arr = data
  .replaceAll(START_WHITESPACE_REMOVE_REGEXP, "")
  .replaceAll(COMMENT_REMOVE_REGEXP, "")
  .split(SPLIT_NEWLINE_REGEXP);

// Parse the data into an array of {instruction, arguments}. This isn't the final form of the arguments, because we still need to convert them to numbers and handle labels/registers and such.
const instructions = data_arr.map((string) => {
  let raw_inst = string.match(INST_EXTRACT_REGEXP);
  let raw_args = string.match(ARG_EXTRACT_REGEXP);
  if (raw_inst !== null) raw_inst = raw_inst[0];
  return {
    inst: raw_inst,
    args: raw_args
  };
});

console.log(instructions);

let finalString = "[";
let programCounter = 0;
// Run through the program once, so that we know our label addresses ahead of time
instructions.forEach((instruction) => {
  if (instruction.inst === null) return;
  if (isComment(instruction.inst)) return;
  if (isLabel(instruction.inst)) {
    labels[instruction.inst.slice(0, instruction.inst.length - 1)] = // We have to remove the leading colon
      programCounter;
    return;
  }
  if (instruction.args !== null && instruction.args.length > 1) {
    for (let i = 1; i < instruction.args.length; i += 2) {
      programCounter++;
    }
  }
  programCounter++;
});
programCounter = 0;
instructions.forEach((instruction) => {
  // Make sure we don't try to use an invalid instruction. If an invalid instruction passes this somehow (I.E. a comment), the program counter will be off, and the program will break.
  if (instruction.inst === null) return;
  if (isComment(instruction.inst)) return;
  if (isLabel(instruction.inst)) return;
  let types;

  // We need to process the arguments a bit, so that we know their types and convert values of labels and such
  if (instruction.args !== null)
    [instruction.args, types] = parseArguments(instruction.args);

  // types/instruction.args will be null if there aren't any arguments, so we need to handle that
  types = types ?? [];
  instruction.args = instruction.args ?? [];

  // TABLE is indexed by [Base instruction type][Argument type(s)]
  let id = instruction.inst + types.join("");
  console.log(id);
  finalString += `(${TABLE[id]},${instruction.args[0] ?? 0}),`;

  // If there are more arguments, we need to add it to the data (and include it in the program counter). This isn't really needed yet, because we will only have at most 1 extra section, but I made this a loop for future utility.
  if (instruction.args.length > 1) {
    for (let i = 1; i < instruction.args.length; i += 2) {
      finalString += `(${instruction.args[i]},${
        instruction.args[i + 1] ?? 0
      }),`;
      programCounter++;
    }
  }
  programCounter++;
});
// The string will end in a comma, so we need to remove it before finishing.
finalString = finalString.slice(0, finalString.length - 1) + "]";
console.log(finalString);
