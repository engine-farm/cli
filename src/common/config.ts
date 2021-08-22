import * as fss from "fs";
import * as fs from "fs/promises";

interface ConfigData {
  manager: {
    token: string;
    apiUrl: string;
  };
  agent: {
    token: string;
    apiUrl: string;
  };
}

export class Config {
  private static configFileName = ".enginefarm.json";

  static saveLocal(data: ConfigData) {
    return fs.writeFile("./" + this.configFileName, JSON.stringify(data));
  }

  static getConfig(): Promise<ConfigData> {
    return fs.readFile("./" + this.configFileName).then((fileContent) => {
      return JSON.parse(fileContent.toString());
    });
  }

  //   static checkConfigIgnore() {
  //     const detectedInsecureSettings = [];
  //     [[".git", ".gitignore"]].map(([existsDir, existsFile]) => {
  //       if (existsDir) {
  //         fss.stat(existsDir, () => {});
  //       }
  //     });
  //     return detectedInsecureSettings;
  //   }
}
