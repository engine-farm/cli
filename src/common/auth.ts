export class Auth {
    static userToken: string;
    static projectAgent: string;
    static manager: string;

    static async getToken(){
        // if(!this.userToken){
        //     return Promise.reject('User token not existing');
        // }
        return this.userToken;
    }

    static async verifyToken(token: string){

    }
}