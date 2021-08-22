/// <reference types="node" />
import * as commander from "commander";
import { ProjectFileChecksum } from "../common/api";
export declare class DiffCommand {
    private program;
    constructor(program: commander.Command);
    findRemoteFile(getActualProjectFiles: ProjectFileChecksum[], filePath: string): ProjectFileChecksum;
    checkConfig(dir: string, debug: boolean): Promise<Buffer>;
    fixFilePath(projectDir: string, filePath: string): string;
}
