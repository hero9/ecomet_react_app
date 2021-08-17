import React, { useState, Fragment } from "react";
import ExTwo from "./components/ExTwo";
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
                    ? <div className="examples">
                        <ExOne connection={ ecomet } />
                        <ExTwo connection={ ecomet } />
                    </div>
                    : <Login options={{ ecomet, onLogin }} />
            }
        </Fragment>
    );
}

export default App;
