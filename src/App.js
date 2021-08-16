import React, {useState, useEffect, Fragment} from "react";
import ExOne from "./components/ExOne";
import Login from "./components/Login";
import Ecomet from "./libs/ecomet";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const ecomet = new Ecomet();

function App() {
    const [ loggedIn, setLogin ] = useState(false);
    const _login = new Login(ecomet);

    // Establishing connection through websocket and log in
    useEffect(()=>{
        const credentials = { "login":"system", "pass":"111111" };

        try {
            _login.setConnection()
                .then(() => {
                    _login.sendCredentials(credentials)
                        .then(()=>{
                            console.log("Congratulations, you are logged in!");
                            setLogin(true);
                        })
                })
        } catch (error) {
            console.error(error);
        }
    },[]);

    return (
        <Fragment>
            {
                loggedIn
                    ? <div className="table">
                        <h3>Example 1: Table</h3>
                        <ExOne connection={ ecomet } />
                    </div>
                    : <h4>Logging in...</h4>
            }
        </Fragment>
    );
}

export default App;
