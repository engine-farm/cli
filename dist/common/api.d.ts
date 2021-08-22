/// <reference types="node" />
interface StateFiles {
    deleted: {
        file: string;
    }[];
    changed: {
        file: string;
        reason?: string;
    }[];
    new: {
        file: string;
    }[];
}
export interface ProjectFileChecksum {
    path: string;
    checksum: string;
    size: number;
}
export declare class ApiEngineFarm {
    static headers(): Promise<{
        [index: string]: string;
    }>;
    static getProjects(): Promise<void>;
    static verifyToken(token: string, managerUrl?: string): Promise<any>;
}
export declare class ApiAgent {
    static headers(): Promise<{
        [index: string]: string;
    }>;
    static getProjectFilesChecksum(): Promise<ProjectFileChecksum[]>;
    static diff(files: ProjectFileChecksum[]): Promise<{
        user: StateFiles;
        remote: StateFiles;
    }>;
    static verifyToken(token: string, projectAgentUrl?: string): Promise<any>;
}
export declare class FileSync {
    static removeFile(fileProjectPath: string): Promise<import("node-fetch").Response>;
    static sendFile(fileProjectPath: string, fileContent: Buffer): Promise<true | import("node-fetch").Response>;
    static diff(projectPath: string): Promise<{
        user: StateFiles;
        remote: StateFiles;
    }>;
}
export {};
