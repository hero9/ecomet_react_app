import React, {useEffect, useState} from "react";
import { Table } from "react-bootstrap";

function Grid({ options }){
    const [_columns, setColumns] = useState([]);
    const [_data, setData] = useState([]);

    const { columns, data } = options;

    useEffect(() => {
        setColumns(columns);
        setData(data);
    }, [columns, data]);

    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    {
                        _columns.map((column,i)=>(
                            <th key={ i }> { column.title } </th>
                        ))
                    }
                </tr>
            </thead>
            <tbody>
                {
                    _data.length > 0
                        ? _data.map((row,i) => (
                            <tr key={ i }>
                                {
                                    _columns.map((column,j) => (
                                        <td key={ j }>{ row[column["key"]] }</td>
                                    ))
                                }
                            </tr>
                        ))
                        : <tr><td>No Data.</td></tr>
                }
            </tbody>
        </Table>
    );
}

export default Grid;