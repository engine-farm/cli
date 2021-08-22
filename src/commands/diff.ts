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
import { Utils } from "../common/utils";


export class DiffCommand {
  constructor(private program: commander.Command) {
    this.program
      .command("diff")
      .description("Checking all your game files with remote")
      .option("-d, --debug", "Debugging")
      .option("-p, --path <path>", "Path to game files")
      .action(async (options, command) => {
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

        return FileSync.diff(options.path).then((apiRes) => {
          console.log("Operations in your files");
          console.table({
            new: apiRes.user?.new?.length,
            changed: apiRes.user?.changed?.length,
            delete: apiRes.user?.deleted?.length,
          });
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
