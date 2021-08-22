"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchCommand = void 0;
const chokidar = require("chokidar");
const fs_1 = require("fs");
const api_1 = require("../common/api");
const md5File = require("md5-file");
const path = require("path");
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
class WatchCommand {
    constructor(program) {
        this.program = program;
        this.program
            .command("watch")
            .description("Watching changes of your files and sending to remote project")
            .option("-d, --debug", "Debugging watching files")
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
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1;
                const showQuestions = {
                    cleanupRemote: false,
                    changes: false,
                    deleted: false,
                };
                if ((_b = (_a = apiRes.user) === null || _a === void 0 ? void 0 : _a.new) === null || _b === void 0 ? void 0 : _b.length) {
                    showQuestions.cleanupRemote = true;
                }
                if ((_d = (_c = apiRes.user) === null || _c === void 0 ? void 0 : _c.changed) === null || _d === void 0 ? void 0 : _d.length) {
                    showQuestions.changes = true;
                }
                if ((_f = (_e = apiRes.user) === null || _e === void 0 ? void 0 : _e.deleted) === null || _f === void 0 ? void 0 : _f.length) {
                    showQuestions.deleted = true;
                }
                if (Object.values(showQuestions).some((e) => e === true)) {
                    console.log();
                    console.warn("Diff found critical changes:");
                    if ((_h = (_g = apiRes.user) === null || _g === void 0 ? void 0 : _g.new) === null || _h === void 0 ? void 0 : _h.length) {
                        console.log("");
                        console.log(`In remote found ${(_k = (_j = apiRes.user) === null || _j === void 0 ? void 0 : _j.new) === null || _k === void 0 ? void 0 : _k.length} new files:`);
                        (_m = (_l = apiRes.user) === null || _l === void 0 ? void 0 : _l.new) === null || _m === void 0 ? void 0 : _m.forEach((file) => console.log(file.file));
                    }
                    if ((_p = (_o = apiRes.user) === null || _o === void 0 ? void 0 : _o.changed) === null || _p === void 0 ? void 0 : _p.length) {
                        console.log("");
                        console.log(`In remote found ${(_r = (_q = apiRes.user) === null || _q === void 0 ? void 0 : _q.changed) === null || _r === void 0 ? void 0 : _r.length} changed files:`);
                        (_t = (_s = apiRes.user) === null || _s === void 0 ? void 0 : _s.changed) === null || _t === void 0 ? void 0 : _t.forEach((file) => console.log(file.file));
                    }
                    if ((_v = (_u = apiRes.user) === null || _u === void 0 ? void 0 : _u.deleted) === null || _v === void 0 ? void 0 : _v.length) {
                        console.log("");
                        console.log(`In remote found ${(_x = (_w = apiRes.user) === null || _w === void 0 ? void 0 : _w.deleted) === null || _x === void 0 ? void 0 : _x.length} deleted files:`);
                        (_z = (_y = apiRes.user) === null || _y === void 0 ? void 0 : _y.deleted) === null || _z === void 0 ? void 0 : _z.forEach((file) => console.log(file.file));
                    }
                    console.log("");
                    console.log("");
                    if ((_1 = (_0 = apiRes.user) === null || _0 === void 0 ? void 0 : _0.new) === null || _1 === void 0 ? void 0 : _1.length) {
                        console.log("Downloading files from remote resources is not available");
                    }
                    console.log("If you continue, some files can be overwrite and game will crash");
                    rl.question("Continue? (y/N)", (answer) => {
                        let runProcess = false;
                        if (!answer || answer === "n" || answer === "N") {
                            console.log("End watching files");
                            process.exit(0);
                        }
                        else if (answer === "y" || answer === "Y") {
                            rl.close();
                            return this.runWatchProcess(options);
                        }
                    });
                }
                else {
                    return this.runWatchProcess(options);
                }
            });
        });
    }
    runWatchProcess(options) {
        return api_1.ApiAgent.getProjectFilesChecksum()
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
                const remoteFile = this.findRemoteFile(getActualProjectFiles, filePath);
                if (!remoteFile) {
                    if (options.debug) {
                        console.log(`Remote file ${filePath} not found, add to upload queue`, { remoteFile });
                    }
                    api_1.FileSync.sendFile(filePath, await fs_1.promises.readFile(projestFilePath))
                        .then((res) => {
                        console.log("file sent", filePath, res);
                    })
                        .catch((err) => {
                        console.error(`[${filePath}] file uplaodeing error`, err);
                    });
                }
                else {
                    if (remoteFile.checksum !== localChecksum) {
                        if (options.debug)
                            console.log("Checksum missmatch, upload file", remoteFile.checksum, localChecksum);
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
                api_1.FileSync.sendFile(filePath, await fs_1.promises.readFile(projestFilePath))
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
                api_1.FileSync.removeFile(filePath)
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
exports.WatchCommand = WatchCommand;
//# sourceMappingURL=watch.js.map