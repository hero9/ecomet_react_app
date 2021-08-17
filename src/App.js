import React, { useState, Fragment } from "react";
import ExOne from "./components/ExOne";
import Login from "./components/Login/index";
import Ecomet from "./libs/ecomet";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const ecomet = new Ecomet();

function App() {
    const [ loggedIn, setLogin ] = useState(false);

    const onLogin = () => {
        setLogin(true);
    }

    return (
        <Fragment>
            {
                loggedIn
                    ? <div className="table">
                        <h3>Example 1: Table</h3>
                        <ExOne connection={ ecomet } />
                    </div>
                    : <Login options={{ ecomet, onLogin }} />  // <h4>Logging in...</h4>
            }
        </Fragment>
    );
}

export default App;
