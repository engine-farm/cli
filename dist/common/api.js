"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSync = exports.ApiAgent = exports.ApiEngineFarm = void 0;
const auth_1 = require("./auth");
const node_fetch_1 = require("node-fetch");
const config_1 = require("./config");
const FormData = require("form-data");
const http_1 = require("http");
const utils_1 = require("./utils");
const md5File = require("md5-file");
const fs_1 = require("fs");
class ApiEngineFarm {
    static async headers() {
        const token = await auth_1.Auth.getToken();
        const headers = {
            "content-type": "application/json",
        };
        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }
        return headers;
    }
    static getProjects() {
        return node_fetch_1.default(`${auth_1.Auth.manager}/projects/list`, {
            method: "POST",
            body: JSON.stringify({}),
        }).then(() => { });
    }
    static async verifyToken(token, managerUrl) {
        return node_fetch_1.default(`${managerUrl || (await config_1.Config.getConfig()).manager.apiUrl}/user/me`, {
            headers: await this.headers(),
        }).then((res) => res.json());
    }
}
exports.ApiEngineFarm = ApiEngineFarm;
class ApiAgent {
    static async headers() {
        const token = await auth_1.Auth.getToken();
        const headers = {
            "content-type": "application/json",
        };
        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }
        return headers;
    }
    static async getProjectFilesChecksum() {
        const config = await config_1.Config.getConfig();
        const auth = await this.verifyToken(config.agent.token, config.agent.apiUrl);
        const res = await node_fetch_1.default(`${config.agent.apiUrl}/files/get-files`, {
            headers: await this.headers(),
        });
        return (await res.json());
    }
    static async diff(files) {
        const config = await config_1.Config.getConfig();
        const auth = await this.verifyToken(config.agent.token, config.agent.apiUrl);
        const res = await node_fetch_1.default(`${config.agent.apiUrl}/files/diff`, {
            headers: await this.headers(),
            method: "POST",
            body: JSON.stringify({
                files,
            }),
        });
        return await res.json();
    }
    static async verifyToken(token, projectAgentUrl) {
        const config = await config_1.Config.getConfig();
        console.log(`${projectAgentUrl || config.agent.apiUrl}/auth/verify-token`);
        return node_fetch_1.default(`${projectAgentUrl || config.agent.apiUrl}/auth/verify-token`, {
            headers: await this.headers(),
        }).then((res) => {
            return res.json();
        });
    }
}
exports.ApiAgent = ApiAgent;
class FileSync {
    static async removeFile(fileProjectPath) {
        const config = await config_1.Config.getConfig();
        const fileName = fileProjectPath.split("/").pop();
        return node_fetch_1.default(`${config.agent.apiUrl}/files/synchronization`, {
            method: "DELETE",
            headers: Object.assign({}, (await ApiAgent.headers())),
            body: JSON.stringify({ filePath: fileProjectPath, fileName }),
        });
    }
    static async sendFile(fileProjectPath, fileContent) {
        const config = await config_1.Config.getConfig();
        console.log(`${config.agent.apiUrl}/files/synchronization`);
        const fileName = fileProjectPath.split("/").pop();
        const form = new FormData();
        form.append("file", fileContent, {
            filename: fileName,
            knownLength: fileContent.length,
            contentType: "text/plain",
        });
        form.append("filePath", fileProjectPath);
        form.append("fileName", fileName);
        const req = http_1.request(`${config.agent.apiUrl}/files/synchronization`, {
            method: "POST",
            headers: Object.assign(Object.assign({}, (await ApiAgent.headers())), form.getHeaders()),
        }, (res) => {
            var body = "";
            res.on("data", function (chunk) {
                body += chunk;
            });
            res.on("end", function () {
                console.log("res", body);
            });
        });
        form.pipe(req);
        return true;
        return node_fetch_1.default(`${config.agent.apiUrl}/files/synchronization`, {
            method: "POST",
            headers: Object.assign(Object.assign({}, (await ApiAgent.headers())), form.getHeaders()),
            body: form,
        }).then(async (res) => {
            console.log(await res.text());
            return res;
        });
    }
    static async diff(projectPath) {
        return new Promise((resolve, reject) => {
            utils_1.Utils.scanDir(projectPath, (err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        })
            .then((files) => {
            const pathSliceStart = projectPath.length + 1;
            return Promise.all(files.map(async (path) => {
                const fileStat = await fs_1.promises.stat(path);
                const relativePath = path.slice(pathSliceStart);
                return {
                    path: relativePath,
                    checksum: await md5File(path),
                    size: fileStat.size,
                };
            }));
        })
            .then((files) => {
            return ApiAgent.diff(files);
        });
    }
}
exports.FileSync = FileSync;
//# sourceMappingURL=api.js.map