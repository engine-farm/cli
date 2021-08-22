import { Auth } from "./auth";
import fetch from "node-fetch";
import { Config } from "./config";
import * as FormData from "form-data";
import { request } from "http";
import { Utils } from "./utils";
const md5File = require("md5-file");
import { promises as fs } from "fs";

interface StateFiles {
  deleted: { file: string }[];
  changed: { file: string; reason?: string }[];
  new: { file: string }[];
}
export interface ProjectFileChecksum {
  path: string;
  checksum: string;
  size: number;
}

export class ApiEngineFarm {
  static async headers() {
    const token = await Auth.getToken();
    const headers: { [index: string]: string } = {
      "content-type": "application/json",
    };
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }
    return headers;
  }

  static getProjects() {
    return fetch(`${Auth.manager}/projects/list`, {
      method: "POST",
      body: JSON.stringify({}),
    }).then(() => {});
  }

  static async verifyToken(token: string, managerUrl?: string) {
    // const token = await Auth.getToken();
    return fetch(
      `${managerUrl || (await Config.getConfig()).manager.apiUrl}/user/me`,
      {
        headers: await this.headers(),
      }
    ).then((res) => res.json());
  }
}

export class ApiAgent {
  static async headers() {
    const token = await Auth.getToken();
    const headers: { [index: string]: string } = {
      "content-type": "application/json",
    };
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }
    return headers;
  }

  static async getProjectFilesChecksum(): Promise<ProjectFileChecksum[]> {
    // console.log(
    //   "[API] getProjectFilesChecksum",
    //   `${Auth.projectAgent}/files/get-files`
    // );
    const config = await Config.getConfig();
    const auth = await this.verifyToken(
      config.agent.token,
      config.agent.apiUrl
    );

    const res = await fetch(`${config.agent.apiUrl}/files/get-files`, {
      headers: await this.headers(),
    });
    return (await res.json()) as ProjectFileChecksum[];
  }

  static async diff(files: ProjectFileChecksum[]): Promise<{
    user: StateFiles;
    remote: StateFiles;
  }> {
    const config = await Config.getConfig();
    const auth = await this.verifyToken(
      config.agent.token,
      config.agent.apiUrl
    );

    const res = await fetch(`${config.agent.apiUrl}/files/diff`, {
      headers: await this.headers(),
      method: "POST",
      body: JSON.stringify({
        files,
      }),
    });

    return await res.json();
  }

  static async verifyToken(token: string, projectAgentUrl?: string) {
    // const token = await Auth.getToken();
    const config = await Config.getConfig();
    console.log(`${projectAgentUrl || config.agent.apiUrl}/auth/verify-token`);
    return fetch(
      `${projectAgentUrl || config.agent.apiUrl}/auth/verify-token`,
      {
        headers: await this.headers(),
        // method: "POST",
        // body: JSON.stringify({ token }),
      }
    ).then((res) => {
      // console.log("AUTH CHECK RES", res);
      return res.json();
    });
  }
}

export class FileSync {
  static async removeFile(fileProjectPath: string) {
    const config = await Config.getConfig();
    const fileName = fileProjectPath.split("/").pop();
    return fetch(`${config.agent.apiUrl}/files/synchronization`, {
      method: "DELETE",
      headers: {
        ...(await ApiAgent.headers()),
        // ...form.getHeaders(),
      },
      body: JSON.stringify({ filePath: fileProjectPath, fileName }),
    });
  }

  static async sendFile(fileProjectPath: string, fileContent: Buffer) {
    const config = await Config.getConfig();
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
    const req = request(
      `${config.agent.apiUrl}/files/synchronization`,
      {
        method: "POST",
        headers: {
          ...(await ApiAgent.headers()),
          ...form.getHeaders(),
          // "Content-Type": "multipart/form-data",
        },
      },
      (res) => {
        // console.log(res); // 200

        var body = "";
        res.on("data", function (chunk) {
          body += chunk;
        });
        res.on("end", function () {
          console.log("res", body);
        });
      }
    );

    form.pipe(req);
    return true;
    return fetch(`${config.agent.apiUrl}/files/synchronization`, {
      // ${config.agent.apiUrl}/files/synchronization
      method: "POST",
      headers: {
        ...(await ApiAgent.headers()),
        ...form.getHeaders(),
        // "Content-Type": "multipart/form-data",
      },
      body: form,
    }).then(async (res) => {
      console.log(await res.text());
      return res;
    });
  }

  static async diff(projectPath: string){
    return new Promise<string[]>((resolve, reject) => {
      Utils.scanDir(projectPath, (err, res) => {
        if (err) {
          return reject(err);
        }
        return resolve(res);
      });
    })
      .then((files) => {
        const pathSliceStart = (projectPath as string).length + 1;
        return Promise.all(
          files.map(async (path) => {
            const fileStat = await fs.stat(path);
            const relativePath = path.slice(pathSliceStart);
            return {
              path: relativePath,
              checksum: await md5File(path),
              size: fileStat.size,
            } as ProjectFileChecksum;
          })
        );
      })
      .then((files) => {
        return ApiAgent.diff(files);
      })
  }
}
