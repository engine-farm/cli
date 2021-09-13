import * as commander from "commander";
import * as chokidar from "chokidar";
import { promises as fs } from "fs";
import {
  ApiAgent,
  ApiEngineFarm,
  FileSync,
  ProjectFileChecksum,
} from "../common/api";
const md5File = require("md5-file");
import * as path from "path";

import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
export class GenerateTypesCommand {
  constructor(private program: commander.Command) {
    this.program
      .command("generate-types")
      .description(
        "Generate all types from game code - action required when module was changed"
      )
      .option("-p, --path <path>", "Path to game files")
      .option("-f, --file-name", "File name with types", "generated-types.ts")
      .option("-d, --debug", "Debugging")
      .action(async (options, command) => {
        options.fileName = !options.fileName
          ? "generated-types.ts"
          : options.fileName;
        if (!options.path) {
          options.path = path.resolve(".");
        } else {
          options.path = path.resolve(options.path);
        }

        try {
          await this.checkConfig(options.path, options.debug);
        } catch (e) {
          console.error("Config file is required");
          process.exit(1);
        }

        console.log("Generating types in progress, please wait...");
        ApiAgent.generateTypes()
          .then((types) => {
            if (types) {
              if (options.debug) {
                console.log("Generated types length:", types.length);
              }
              return fs
                .writeFile(`${options.path}/${options.fileName}`, types)
                .then(() => {
                  if (options.debug) {
                    console.log(
                      "Types saved to file:",
                      `${options.path}/${options.fileName}`
                    );
                  }
                  console.log("Successfully generated.");
                  return true;
                });
            } else {
              return Promise.reject("Generated empty types");
            }
          })
          .finally(() => {
            process.exit(0);
          });
      });
  }

  findRemoteFile(
    getActualProjectFiles: ProjectFileChecksum[],
    filePath: string
  ) {
    // console.log("getActualProjectFiles", getActualProjectFiles);
    return getActualProjectFiles.find((f) => f.path === filePath);
  }

  checkConfig(dir: string, debug: boolean) {
    const fileConfig = dir + "/config.yaml";
    if (debug) {
      console.log("Check config file:", fileConfig);
    }
    return fs.readFile(fileConfig);
  }

  fixFilePath(projectDir: string, filePath: string) {
    return filePath.split(projectDir)[1].slice(1);
  }
}
