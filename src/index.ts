#!/usr/bin/env node

import { Command } from "commander";
import { DiffCommand } from "./commands/diff";
import { GenerateTypesCommand } from "./commands/generate-types";
import { LoginCommand } from "./commands/login";
import { WatchCommand } from "./commands/watch";
const program = new Command();

new LoginCommand(program);
new WatchCommand(program);
new DiffCommand(program);
new GenerateTypesCommand(program);

program.parse(process.argv);
