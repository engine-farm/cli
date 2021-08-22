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
export class WatchCommand {
  constructor(private program: commander.Command) {
    this.program
      .command("watch")
      .description(
        "Watching changes of your files and sending to remote project"
      )
      .option("-d, --debug", "Debugging watching files")
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
          const showQuestions = {
            cleanupRemote: false,
            changes: false,
            deleted: false,
          };
          if (apiRes.user?.new?.length) {
            showQuestions.cleanupRemote = true;
          }
          if (apiRes.user?.changed?.length) {
            showQuestions.changes = true;
          }
          if (apiRes.user?.deleted?.length) {
            showQuestions.deleted = true;
          }

          if (Object.values(showQuestions).some((e) => e === true)) {
            console.log();
            console.warn("Diff found critical changes:");
            if (apiRes.user?.new?.length) {
              console.log("");
              console.log(
                `In remote found ${apiRes.user?.new?.length} new files:`
              );
              apiRes.user?.new?.forEach((file) => console.log(file.file));
            }
            if (apiRes.user?.changed?.length) {
              console.log("");
              console.log(
                `In remote found ${apiRes.user?.changed?.length} changed files:`
              );
              apiRes.user?.changed?.forEach((file) => console.log(file.file));
            }
            if (apiRes.user?.deleted?.length) {
              console.log("");
              console.log(
                `In remote found ${apiRes.user?.deleted?.length} deleted files:`
              );
              apiRes.user?.deleted?.forEach((file) => console.log(file.file));
            }
            console.log("");
            console.log("");
            if (apiRes.user?.new?.length) {
              console.log(
                "Downloading files from remote resources is not available"
              );
            }
            console.log(
              "If you continue, some files can be overwrite and game will crash"
            );
            rl.question("Continue? (y/N)", (answer) => {
              let runProcess = false;
              if (!answer || answer === "n" || answer === "N") {
                console.log("End watching files");
                process.exit(0);
              } else if (answer === "y" || answer === "Y") {
                rl.close();
                return this.runWatchProcess(options);
              }
            });
          } else {
            return this.runWatchProcess(options);
          }

          // console.log(JSON.stringify(apiRes.user, null, 2));
        });
      });
  }

  runWatchProcess(options: { path: string; debug: boolean }) {
    return ApiAgent.getProjectFilesChecksum()
      .then((getActualProjectFiles) => {
        chokidar
          .watch(options.path, {})
          .on("add", async (filePath) => {
            filePath = path.resolve(filePath);
            const projestFilePath = filePath;
            const localChecksum = await md5File(filePath);

            filePath = this.fixFilePath(options.path, filePath);
            if (options.debug)
              console.log(`File ${projestFilePath} has been added`, {
                checksum: localChecksum,
              });

            const remoteFile = this.findRemoteFile(
              getActualProjectFiles,
              filePath
            );

            if (!remoteFile) {
              if (options.debug) {
                console.log(
                  `Remote file ${filePath} not found, add to upload queue`,
                  { remoteFile }
                );
              }
              FileSync.sendFile(filePath, await fs.readFile(projestFilePath))
                .then((res) => {
                  console.log("file sent", filePath, res);
                })
                .catch((err) => {
                  console.error(`[${filePath}] file uplaodeing error`, err);
                });
            } else {
              if (remoteFile.checksum !== localChecksum) {
                if (options.debug)
                  console.log(
                    "Checksum missmatch, upload file",
                    remoteFile.checksum,
                    localChecksum
                  );
              }
            }
          })
          .on("change", async (filePath) => {
            filePath = path.resolve(filePath);
            const projestFilePath = filePath;
            const localChecksum = await md5File(filePath);
            filePath = this.fixFilePath(options.path, filePath);
            if (options.debug) {
              console.log(`File ${filePath} has been changed`);
            }

            FileSync.sendFile(filePath, await fs.readFile(projestFilePath))
              .then((res) => {
                console.log("file sent", filePath, res);
              })
              .catch((err) => {
                console.error(`[${filePath}] file uplaodeing error`, err);
              });
          })
          .on("unlink", (filePath) => {
            filePath = path.resolve(filePath);
            filePath = this.fixFilePath(options.path, filePath);
            if (options.debug) {
              console.log(`File ${filePath} has been removed`);
            }
            FileSync.removeFile(filePath)
              .then(async (res) => {
                console.log("delete res", res);
                console.log(await res.text());
              })
              .catch((errDel) => {
                console.error("errDel", errDel);
              });
          });
      })
      .catch((e) => {
        console.error(e);
        process.exit(1);
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
