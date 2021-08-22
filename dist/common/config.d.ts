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
export declare class Config {
    private static configFileName;
    static saveLocal(data: ConfigData): Promise<void>;
    static getConfig(): Promise<ConfigData>;
}
export {};
