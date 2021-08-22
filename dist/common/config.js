"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const fs = require("fs/promises");
class Config {
    static saveLocal(data) {
        return fs.writeFile("./" + this.configFileName, JSON.stringify(data));
    }
    static getConfig() {
        return fs.readFile("./" + this.configFileName).then((fileContent) => {
            return JSON.parse(fileContent.toString());
        });
    }
}
exports.Config = Config;
Config.configFileName = ".enginefarm.json";
//# sourceMappingURL=config.js.map