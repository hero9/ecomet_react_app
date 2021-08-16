import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Datetime from 'react-datetime';

import { getDataFromTS } from "../../utils/data";
import Grid from "../Grid";

import "react-datetime/css/react-datetime.css";

function Index({ connection }){
    const [columns, setColumns] = useState([]);
    const [data, setData] = useState([]);
    const [from, setFrom] = useState(new Date());
    const [to, setTo] = useState(new Date());

    const fetchData = () => {
        const options = {
            "from": +from,
            "to": +to
        };

        try {
            // Request data from
            getDataFromTS(connection,options,onData)
                .then((archives)=>{
                    const _columns = archives.map((item) => {
                        return {
                            title: item.name,
                            key: item.name.toLowerCase(),
                        }
                    });
                    setColumns(_columns);
                });
        } catch (error) {
            console.error(error)
        }
    }

    const onData = (data) => {
        setData(data.items);
    }

    const onChange = (moment,name) => {
        name==="from"
            ? setFrom(+moment.toDate())
            : setTo((+moment.toDate()));
    }

    return (
        <>
            <div className="exone_options">
                <Datetime required inputProps={{ placeholder:"FROM" }} onChange={(e) => { onChange(e,"from") }} />
                <Datetime required inputProps={{ placeholder:"TO" }} onChange={(e) => { onChange(e,"to") }} />
                <Button onClick={ fetchData } className="fetch_btn">Fetch</Button>
            </div>
            <div className="exone_widget">
                <Grid options={{ columns, data }} />
            </div>
        </>
    );
}

export default Index;