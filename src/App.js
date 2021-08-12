import React from "react";
import "./App.css";
import GridWidget from "./Grid/GridWidget";
import Ecomet from "./libs/ecomet";
import Login from "./Login/login";

const ecomet = new Ecomet();

function App() {
    const login = new Login(ecomet);

    return (
        <>
            <GridWidget connection={ ecomet } />
        </>
    );
}

export default App;
