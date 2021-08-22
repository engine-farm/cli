export declare class Auth {
    static userToken: string;
    static projectAgent: any;
    static manager: any;
    static getToken(): Promise<string>;
    static verifyToken(token: string): Promise<void>;
}
