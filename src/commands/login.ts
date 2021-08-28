import * as commander from "commander";
import { ApiAgent, ApiEngineFarm } from "../common/api";
import { Config } from "../common/config";

export class LoginCommand {
  constructor(private program: commander.Command) {
    this.program
      .command("login <accessToken> <agentToken> <agentUrl>")
      .option("-m, --manager-api <managerApi>", "URL to manager api")
      .action(
        async (
          accessToken,
          agentToken,
          agentUrl,
          options?: { managerApi: string }
        ) => {
          const agentApiUrl = "https://" + agentUrl;
          const managerApiUrl =
            options?.managerApi || "https://api.engine.farm";
          const user = await ApiEngineFarm.verifyToken(
            accessToken,
            managerApiUrl
          );
          const authorized = await ApiAgent.verifyToken(
            agentToken,
            agentApiUrl
          );
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
              process.exit(0);
            })
            .catch(() => {
              throw new Error("Error saving config file");
            });
        }
      );
  }
}
