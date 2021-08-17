class Connect {
    constructor(connection) {
        const _this=this;
        _this.retryPause = 5000;
        _this._connection=connection;
        _this.URL="http://localhost:9000/websocket";
        _this._URL="http://localhost:3000";
    }

    setConnection(){
        const _this = this;

        return new Promise((resolve, reject) => {
            _this._connection.connectUrl(_this.URL,
                // Соединение установлено
                ()=> { resolve(); },
                // Покажем ошибку
                (errorText) => { reject(errorText); },
                () => {  }
            );
        });
    }

    sendCredentials(credentials){
        const _this = this;
        _this._URL=_this._URL.replace(/\/websocket$/,"");
        const { login, pass } = credentials;

        return new Promise((resolve,reject) => {
            _this._connection.login(login,pass,
                ()=>{ resolve() },
                (error) => { reject(error) },
                5000
            );
        });
    }
}

export default Connect;

