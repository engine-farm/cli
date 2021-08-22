"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiffCommand = void 0;
const fs_1 = require("fs");
const api_1 = require("../common/api");
const md5File = require("md5-file");
const path = require("path");
class DiffCommand {
    constructor(program) {
        this.program = program;
        this.program
            .command("diff")
            .description("Checking all your game files with remote")
            .option("-d, --debug", "Debugging")
            .option("-p, --path <path>", "Path to game files")
            .action(async (options, command) => {
            if (!options.path) {
                options.path = path.resolve(".");
            }
            else {
                options.path = path.resolve(options.path);
            }
            try {
                await this.checkConfig(options.path, options.debug);
            }
            catch (e) {
                console.error("Config file is required");
                process.exit(1);
            }
            return api_1.FileSync.diff(options.path).then((apiRes) => {
                var _a, _b, _c, _d, _e, _f;
                console.log("Operations in your files");
                console.table({
                    new: (_b = (_a = apiRes.user) === null || _a === void 0 ? void 0 : _a.new) === null || _b === void 0 ? void 0 : _b.length,
                    changed: (_d = (_c = apiRes.user) === null || _c === void 0 ? void 0 : _c.changed) === null || _d === void 0 ? void 0 : _d.length,
                    delete: (_f = (_e = apiRes.user) === null || _e === void 0 ? void 0 : _e.deleted) === null || _f === void 0 ? void 0 : _f.length,
                });
            });
        });
    }
    findRemoteFile(getActualProjectFiles, filePath) {
        return getActualProjectFiles.find((f) => f.path === filePath);
    }
    checkConfig(dir, debug) {
        const fileConfig = dir + "/config.yaml";
        if (debug) {
            console.log("Check config file:", fileConfig);
        }
        return fs_1.promises.readFile(fileConfig);
    }
    fixFilePath(projectDir, filePath) {
        return filePath.split(projectDir)[1].slice(1);
    }
}
exports.DiffCommand = DiffCommand;
//# sourceMappingURL=diff.js.map