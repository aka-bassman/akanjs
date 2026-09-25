import chalk from "chalk";

import { type EnumChoice, getArgMetas } from "./argMeta";
import { type CommandCls, getTargetMetas } from "./targetMeta";

const camelToKebabCase = (str: string) => str.replace(/([A-Z])/g, "-$1").toLowerCase();
const formatChoice = (choice: EnumChoice) => (typeof choice === "object" ? choice.label : choice.toString());

const groupCommands = (commands: CommandCls[]) => {
  const groups = new Map<string, { name: string; commands: { key: string; args: string[]; desc?: string }[] }>();

  for (const command of commands) {
    const className = command.name.replace("Command", "");
    const groupName = className;

    if (!groups.has(groupName)) {
      groups.set(groupName, { name: groupName, commands: [] });
    }

    const targetMetas = getTargetMetas(command);
    for (const targetMeta of targetMetas) {
      // Skip devOnly commands in help
      if (targetMeta.targetOption.devOnly) continue;

      const [allArgMetas] = getArgMetas(command, targetMeta.key);
      const args = allArgMetas
        .filter((arg) => arg.type !== "Option")
        .map((arg) => {
          if (arg.type === "Workspace") return "";
          if (arg.type === "Module") return "[sys:module]";
          if (arg.type === "Argument") {
            return `[${arg.name}]`;
          }
          return `[${arg.type.toLowerCase()}]`;
        })
        .filter(Boolean);

      const group = groups.get(groupName);
      if (group) {
        group.commands.push({
          key: camelToKebabCase(targetMeta.key),
          args,
          desc: targetMeta.targetOption.desc,
        });
      }
    }
  }

  return groups;
};

export const formatHelp = (commands: CommandCls[], version: string) => {
  const groups = groupCommands(commands);
  const lines: string[] = [];

  // Header
  lines.push("");
  lines.push(chalk.bold.cyan("  ╔═══════════════════════════════════════════════════╗"));
  lines.push(
    chalk.bold.cyan("  ║") +
      chalk.bold.white("              Akan.js Framework CLI            ") +
      chalk.bold.cyan("    ║"),
  );
  lines.push(chalk.bold.cyan("  ╚═══════════════════════════════════════════════════╝"));
  lines.push("");
  lines.push(chalk.gray(`  Version: ${version}`));
  lines.push("");

  // Usage
  lines.push(chalk.bold.yellow("  USAGE"));
  lines.push("");
  lines.push(chalk.gray("    $ ") + chalk.white("akan") + chalk.gray(" <command> [options]"));
  lines.push("");

  // Commands by category
  lines.push(chalk.bold.yellow("  COMMANDS"));
  lines.push("");

  for (const [groupName, group] of groups) {
    // Skip empty groups (all commands are devOnly)
    if (group.commands.length === 0) continue;

    lines.push(chalk.bold.magenta(`    ${groupName}`));
    lines.push("");

    for (const cmd of group.commands) {
      const cmdName = chalk.green(cmd.key);
      const cmdArgs = cmd.args.length > 0 ? chalk.gray(` ${cmd.args.join(" ")}`) : "";

      // Format description: wrap if too long
      if (cmd.desc) {
        const maxLineLength = 70;
        const cmdPrefix = `      ${cmdName}${cmdArgs}`;
        const indent = "        ";

        if (cmdPrefix.length + cmd.desc.length + 3 < maxLineLength) {
          // Single line
          lines.push(`${cmdPrefix}  ${chalk.gray(cmd.desc)}`);
        } else {
          // Multi-line
          lines.push(cmdPrefix);
          lines.push(`${indent}${chalk.gray(cmd.desc)}`);
        }
      } else {
        lines.push(`      ${cmdName}${cmdArgs}`);
      }
    }
    lines.push("");
  }

  // Global Options
  lines.push(chalk.bold.yellow("  OPTIONS"));
  lines.push("");
  lines.push(`      ${chalk.green("-v, --verbose")}      ${chalk.gray("Enable verbose output")}`);
  lines.push(`      ${chalk.green("-h, --help")}         ${chalk.gray("Display this help message")}`);
  lines.push(`      ${chalk.green("-V, --version")}      ${chalk.gray("Output version number")}`);
  lines.push("");

  // Examples
  lines.push(chalk.bold.yellow("  EXAMPLES"));
  lines.push("");
  lines.push(chalk.gray("    # Create a new workspace"));
  lines.push(chalk.white("    $ akan create-workspace myproject"));
  lines.push("");
  lines.push(chalk.gray("    # Start development server"));
  lines.push(chalk.white("    $ akan start myapp"));
  lines.push("");
  lines.push(chalk.gray("    # Create a new module"));
  lines.push(chalk.white("    $ akan create-module userProfile"));
  lines.push("");

  // Footer
  lines.push(chalk.gray("  Documentation: ") + chalk.cyan("https://akanjs.com/docs"));
  lines.push(chalk.gray("  Report issues: ") + chalk.cyan("https://github.com/akan-team/akanjs/issues"));
  lines.push("");

  return lines.join("\n");
};

export const formatCommandHelp = (command: CommandCls, key: string) => {
  const [allArgMetas, argMetas] = getArgMetas(command, key);
  const kebabKey = camelToKebabCase(key);
  const lines: string[] = [];

  const targetMetas = getTargetMetas(command);
  const targetMeta = targetMetas.find((t) => t.key === key);
  const commandDesc = targetMeta?.targetOption.desc;

  lines.push("");
  lines.push(chalk.bold.cyan(`  Command: ${kebabKey}`));
  if (commandDesc) {
    lines.push(chalk.gray(`  ${commandDesc}`));
  }
  lines.push("");

  // Usage
  const args = allArgMetas
    .filter((arg) => arg.type !== "Option")
    .map((arg) => {
      if (arg.type === "Workspace") return "";
      if (arg.type === "Module") return "[sys:module]";
      if (arg.type === "Apps") return "[apps...]";
      if (arg.type === "Argument") {
        return `[${camelToKebabCase(arg.name)}]`;
      }
      return `[${arg.type.toLowerCase()}]`;
    })
    .filter(Boolean)
    .join(" ");

  lines.push(chalk.bold.yellow("  USAGE"));
  lines.push("");
  lines.push(chalk.gray("    $ ") + chalk.white(`akan ${kebabKey}`) + (args ? chalk.gray(` ${args}`) : ""));
  lines.push("");

  // Arguments
  const nonOptionArgs = allArgMetas.filter((arg) => arg.type !== "Option");
  if (nonOptionArgs.length > 0) {
    lines.push(chalk.bold.yellow("  ARGUMENTS"));
    lines.push("");

    for (const arg of nonOptionArgs) {
      if (arg.type === "Workspace") continue;

      let argName: string;
      let argDesc: string;
      let example = "";

      if (arg.type === "Argument") {
        argName = camelToKebabCase(arg.name);
        argDesc = arg.argsOption.desc ?? "";
        example = arg.argsOption.example ? chalk.gray(` (e.g., ${String(arg.argsOption.example)})`) : "";
      } else if (arg.type === "Module") {
        argName = "sys:module";
        argDesc = "Module in format: app-name:module-name or lib-name:module-name";
      } else if (arg.type === "Apps") {
        argName = "apps...";
        argDesc = "App names, space- or comma-separated, or all. Omit to pick them interactively";
      } else {
        argName = arg.type.toLowerCase();
        argDesc = `${arg.type} name in this workspace`;
      }

      lines.push(`      ${chalk.green(argName)}      ${chalk.gray(argDesc)}${example}`);
    }

    lines.push("");
  }

  // Options
  const optionArgs = argMetas.filter((a) => a.type === "Option");
  if (optionArgs.length > 0) {
    lines.push(chalk.bold.yellow("  OPTIONS"));
    lines.push("");

    for (const arg of optionArgs) {
      const opt = arg.argsOption;
      const flag = opt.flag ? `-${opt.flag}, ` : "";
      const kebabName = camelToKebabCase(arg.name);
      const negation = opt.type === "boolean" && opt.default === true ? `, --no-${kebabName}` : "";
      const optName = `${flag}--${kebabName}${negation}`;
      const optDesc = opt.desc ?? "";
      const defaultVal = opt.default !== undefined ? chalk.gray(` [default: ${String(opt.default)}]`) : "";
      const choices = opt.enum
        ? chalk.gray(
            typeof opt.enum === "function" ? " ([dynamic choices])" : ` (${opt.enum.map(formatChoice).join(", ")})`,
          )
        : "";
      lines.push(`      ${chalk.green(optName)}      ${chalk.gray(optDesc)}${defaultVal}${choices}`);
    }
    lines.push("");
  }

  return lines.join("\n");
};
