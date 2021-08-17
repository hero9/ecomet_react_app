# Technologies

This project was developed with:
 - React
 - Ecomet
 - TS_datasource
 - Bootstrap

# File structure
```
.
    ├── ...
    ├── src                                        # Source
    │   ├── components                             # Components
    │   │   ├── ExOne                              # Folder contains bar chart and it's config
    │   │   ├── ExTwo                              # Folder contains configs of grid
    │   │   ├── Grid                               # Folder renders grid
    │   │   └── Login                              # Folder contains login form, establishin connection and login request
    │   ├── libs                                   # Libraries that help to work with ecomet
    │   │   ├── ecomet.js                          # Class Ecomet that contains main method to work with it
    │   │   ├── ecomet-kendo-datasource.js         # Module that contains interlayer on kendo datasource
    │   │   └── fp-ts-kendo-datasource.js          # Class that contains methods to wrk with TS_datasource
    │   ├── utils                                  # Utilities
    │   │   └── data.js                            # Load data and some helper functions
    │   ├── App.css
    │   └── index.js
    └── package.json
    
```

# Getting Started

Для получения данных из Ecomet DB используется Websocket. Поэтому чтобы начать работу импортируем `class Ecomet` из `src/libs/ecomet.js` и получим новый инстанс этого класса
```
import Ecomet from "./libs/ecomet.js"
const ecomet = new Ecomet();

const _connect = new Connect(ecomet);
```
Далее нужно создать новое соединение Websocket и залогиниться. Для этого создадим новый инстанс класса `Connect` из файла `src/components/Login/Connect.js` и передадим туда инстанс `ecomet`. Вызовем метод `setConnection` для установки соединения, после успешной операции отправим наши credentials по этому соединению.
```
import Connect from "./components/Login/connect";

const _connect = new Connect(ecomet);

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
```
После выполнения данных операций у нас есть готовое соединение по которому мы можем запросить данные.

Запрос данных через `ecomet-kendo-datasource`: (Полное код можно посмотреть в `./src/components/ExOne/index.jsx`)
```
import ecomet_util from "./libs/ecomet-kendo-datasource";

// Init datasource
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

// Quering data
ds.fetch(function() {
    console.log(ds.view());
});

```

Запрос данных через `TS_datasource`: (Полное код можно посмотреть в `./src/components/ExTwo/index.jsx`)
```
import TS_Datasource from "./libs/fp-ts-kendo-datasource";

// The function that triggers when data comes from DB.
const onData = (data) => {
     console.log(data.items);
}

// Options
const options = { "timeout":300000,"kendo":{ change: onData } };

// Archives
const archives = [
     {"aggregate":"avg","archive":"/root/PROJECT/TAGS/fancytree/archive","name":"archive"},  
     {"aggregate":"avg","archive":"/root/PROJECT/TAGS/fancytree/archive_0","name":"archive_0"}
];

// Init new instance of timeseries datasource
const ts_datasource = new TS_Datasource(connection,archives,options);

// Set filters (Full code of this function see in 'src/utils/data.js')
execute(ts_datasource,1628445600000,1628445780000,"second",1000);

```







