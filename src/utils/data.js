import TS_Datasource from "../libs/fp-ts-kendo-datasource";

const getDataFromTS = (connection, options, onChange) => {
    const { from, to } = options;

    return new Promise((resolve, reject) => {
        // Request to get all archives from DB
        connection.find("GET .name,.folder from root WHERE .pattern=$oid('/root/.patterns/ARCHIVE')",function (result) {
            const { set } = result;
            // Preparing archives list to init timeseries datasource
            const archives = set.map(item => {
                const { ".folder":folder, ".name":name } = item.fields;
                return {
                    aggregate: "avg",
                    archive: folder+"/"+name,
                    name
                }
            });
            // Preparing options to init timeseries datasource
            const options = { timeout:300000 };
            // Pass callback that triggers when data comes to datasource
            if(typeof onChange === "function"){
                options.kendo = { "change": onChange };
            }
            // Init new instance of timeseries datasource
            const ts_datasource = new TS_Datasource(connection,archives,options);
            // Set filters for requesting data from archives
            execute(ts_datasource, from,to,"second",1000);
            resolve(archives);
        },(error)=>{ reject(error) },5000);
    })
}

function execute(source,from,to,step,stepFactor){
    if (source===undefined){ return; }

    let filter;
    if (valueDefined(step)){
        if (!valueDefined(stepFactor)){
            stepFactor=1;
        }
        let steps={
            "millisecond":1,
            "second":1000,
            "minute":60000,
            "hour":3600000,
            "day":86400000,
            "week":86400000*7,
            "month":86400000*30,
            "year":86400000*365
        };

        let stepCount=Math.round((to-from)/(steps[step]));
        filter={
            "start":from,
            "step_unit":step,
            "step_size":stepFactor,
            "step_count":stepCount,
        }
    }else{
        filter=[from,to];
    }
    source.datasource().filter(filter);
}

const valueDefined = (value) => {
    if (Array.isArray(value)){
        return value.length>0;
    }else{
        return ((value!==undefined)&&(value!=="")&&(value!==null));
    }
}

const getFields = () => {
    return {
        "_name": {type: "string", nullable: false},
        "_pattern": {type: "string", nullable: false},
        "_folder": {type: "string", nullable: false},
        "value": {type: "string", nullable: true},
    };
}

export { getDataFromTS, valueDefined, getFields }