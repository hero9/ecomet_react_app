import TS_Datasource from "../libs/fp-ts-kendo-datasource";
class Login {
    constructor(connection) {
        const _this=this;
        _this.retryPause = 5000;
        _this._connection=connection;
        _this._URL="http://localhost:9000/websocket";
        _this.__URL="http://localhost:3000";
        this.doConnect(() => {
            _this.initMarkup();
        })
    }

    initMarkup(){
        const _this = this;
        _this.btn = document.createElement("button");
        _this.btn.setAttribute("name","btn-login")
        _this.btn.innerText="Connect";
        _this.btn.addEventListener("click", (e) => {
            const credentials = { "login":"system", "pass":"111111" };
            _this.saveCredentials(credentials);
        });
        document.body.appendChild(_this.btn);
    }

    doConnect(onOk){
        const _this = this;

        _this._connection.connectUrl(_this._URL,
            // Соединение установлено
            function(){
                const _token = window.localStorage.getItem("token");
                const _session = window.sessionStorage;
                if(_token!==null){
                    _this.saveCredentials({ "token":_token, "session":_session });
                }else{
                    onOk();
                }
                _this.retryPause=0;
            },
            // Покажем ошибку
            function(ErrorText){ console.error(ErrorText);  },
            // Обрыв
            function(){
                setTimeout(()=>{
                    _this.doConnect(onOk);
                },_this.retryPause);
                _this.retryPause=1000;
            }

        );
    }

    saveCredentials(credentials){
        const _this = this;
        _this._URL=_this._URL.replace(/\/websocket$/,"");
        const { login, pass } = credentials;

        _this._connection.login(login,pass,
            ()=>{
                _this._connection.find("GET .name,.folder from root WHERE .pattern=$oid('/root/.patterns/ARCHIVE')",function (result) {
                    console.log(result);
                    const archives = result.set.map(item => {
                        return {
                            aggregate: "avg",
                            archive: item[".folder"]+"/"+item[".name"],
                            name:item[".name"]
                        }
                    })
                    const options = { timeout:300000 }
                    // const tsDatasource = new TS_Datasource(undefined,archives,options);
                    // console.log(tsDatasource);
                },(error)=>{ console.error(error) },5000);
            },
            (error)=>{ console.error(error); }, 5000);
    }
}

export default Login;

