import React, {useEffect, useState} from "react";
import ecomet_util from "../../libs/ecomet-kendo-datasource";
import { getFields } from "../../utils/data";

import Chart from "react-apexcharts";

function ExOne({ connection }) {
    const [labels, setLabels] = useState([]);
    const [data, setData] = useState([]);

    const initDS = () => {
        const fields = getFields();
        // Base query for objects
        const filter={logic:"and",filters:[
                {field:"_pattern",operator:"eq",value:"$oid('/root/.patterns/STATE')"},
                {field:"_folder",operator:"eq",value:"$oid('/root/PROJECT/TAGS/fancytree')"}
            ]};
        // Create a datasource to display
        return ecomet_util.kendo_datasource({
            connection:connection,
            fields:fields,
            baseFilter:filter,
            serverFiltering:true,
            serverSorting:false,
            serverPaging:false,
            subscribe:false,
            pageSize:30,
            error:e=>{ console.error(e.xhr); }
        });

    }

    const chartOptions = {
        options: {
            chart: {
                id: "basic-bar"
            },
            xaxis: {
                categories: labels
            }
        },
        series: [
            {
                name: "series-1",
                data: data
            }
        ]
    }

    useEffect(() => {
        const ds = initDS();
        ds.fetch(function() {
            const labels = ds.view().map(item => {
                return item["_name"];
            });
            setLabels(labels);
            const data = ds.view().map(item => {
                return +item["value"];
            });
            setData(data);
        });
    },[]);

    return (
        <>
            <h4>Example 1: Bar chart</h4>
            <div className="app">
                <div className="row">
                    <div className="mixed-chart">
                        <Chart
                            options={ chartOptions.options }
                            series={ chartOptions.series }
                            type="bar"
                            width="500"
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default ExOne;