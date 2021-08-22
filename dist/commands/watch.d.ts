/// <reference types="node" />
import * as commander from "commander";
import { ProjectFileChecksum } from "../common/api";
export declare class WatchCommand {
    private program;
    constructor(program: commander.Command);
    runWatchProcess(options: {
        path: string;
        debug: boolean;
    }): Promise<void>;
    findRemoteFile(getActualProjectFiles: ProjectFileChecksum[], filePath: string): ProjectFileChecksum;
    checkConfig(dir: string, debug: boolean): Promise<Buffer>;
    fixFilePath(projectDir: string, filePath: string): string;
}
