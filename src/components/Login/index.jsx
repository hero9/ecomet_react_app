import React, { useRef } from "react";
import { Form, Button } from "react-bootstrap";
import Connect from "./connect";

function Login({ options }) {
    const { ecomet, onLogin } = options;
    const _connect = new Connect(ecomet);

    const _login = useRef(null);
    const _pass = useRef(null);

    // Establishing connection through websocket and log in
    const onSubmit = (e) => {
        e.preventDefault();
        const credentials = { "login":_login.current.value, "pass":_pass.current.value };

        try {
            _connect.setConnection()
                .then(() => {
                    _connect.sendCredentials(credentials)
                        .then(()=>{
                            console.log("Congratulations, you are logged in!");
                            onLogin();
                        })
                })
        } catch (error) {
            console.error(error);
        }
        console.log(_login.current.value, _pass);
    }


    return (
        <Form style={{ marginTop: "50%" }} onSubmit={ onSubmit }>
            <Form.Group className="mb-3" controlId="formBasicLogin">
                <Form.Label>Login</Form.Label>
                <Form.Control type="text" placeholder="Enter login" ref={ _login } required />
                <Form.Text className="text-muted">
                    We'll never share your login with anyone else.
                </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" placeholder="Password" ref={ _pass } required/>
            </Form.Group>
            <Button variant="primary" type="submit">
                Submit
            </Button>
        </Form>
    );
}

export default Login;