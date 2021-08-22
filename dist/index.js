"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const diff_1 = require("./commands/diff");
const login_1 = require("./commands/login");
const watch_1 = require("./commands/watch");
const program = new commander_1.Command();
new login_1.LoginCommand(program);
new watch_1.WatchCommand(program);
new diff_1.DiffCommand(program);
program.parse(process.argv);
//# sourceMappingURL=index.js.map