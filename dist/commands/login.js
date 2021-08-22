"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginCommand = void 0;
const api_1 = require("../common/api");
const config_1 = require("../common/config");
class LoginCommand {
    constructor(program) {
        this.program = program;
        this.program
            .command("login <accessToken> <agentToken> <agentUrl>")
            .action(async (accessToken, agentToken, agentUrl) => {
            const agentApiUrl = "https://" + agentUrl;
            const managerApiUrl = "http://dev1.engine.farm:3001";
            const user = await api_1.ApiEngineFarm.verifyToken(accessToken, managerApiUrl);
            const authorized = await api_1.ApiAgent.verifyToken(agentToken, agentApiUrl);
            if (!authorized) {
                throw new Error("Invalid token");
            }
            return config_1.Config.saveLocal({
                agent: {
                    token: agentToken,
                    apiUrl: agentApiUrl,
                },
                manager: {
                    token: accessToken,
                    apiUrl: managerApiUrl,
                },
            })
                .then(() => {
                console.log("Success logged in");
            })
                .catch(() => {
                throw new Error("Error saving config file");
            });
        });
    }
}
exports.LoginCommand = LoginCommand;
//# sourceMappingURL=login.js.map