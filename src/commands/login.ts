import * as commander from "commander";
import { ApiAgent, ApiEngineFarm } from "../common/api";
import { Config } from "../common/config";

export class LoginCommand {
  constructor(private program: commander.Command) {
    this.program
      .command("login <accessToken> <agentToken> <agentUrl>")
      .action(async (accessToken, agentToken, agentUrl) => {
        const agentApiUrl = "https://" + agentUrl;
        const managerApiUrl = "http://dev1.engine.farm:3001";
        const user = await ApiEngineFarm.verifyToken(
          accessToken,
          managerApiUrl
        );
        const authorized = await ApiAgent.verifyToken(agentToken, agentApiUrl);
        if (!authorized) {
          throw new Error("Invalid token");
        }
        return Config.saveLocal({
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

// c2ea146ea5fab46ebaeecc9ea3c49269 test agent-test2-europe-nuremberg-a.ept.run
