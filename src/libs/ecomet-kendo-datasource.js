//-----------------------------------------------------------------
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2016, Vozzhenikov Roman
// Author: Vozzhenikov Roman, vzroman@gmail.com.
//
// Alternatively, the contents of this file may be used under the terms
// of the GNU General Public License Version 2.0, as described below:
//
// This file is free software: you may copy, redistribute and/or modify
// it under the terms of the GNU General Public License as published by the
// Free Software Foundation, either version 2.0 of the License, or (at your
// option) any later version.
//
// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
// Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see http://www.gnu.org/licenses/.
//
//-----------------------------------------------------------------
import kendo from "@progress/kendo-ui";

let ecomet_util;
(function () {
    if (ecomet_util===undefined){ ecomet_util={}; }
    if (ecomet_util.kendo_util === undefined) {
        ecomet_util.kendo_util = {};
    }

    if (typeof ecomet_util.kendo_datasource !== 'function') {
        ecomet_util.kendo_datasource=function (params) {
            return new EcometKendoDatasource(params)
        }
    }

    if (typeof ecomet_util.parse_filter !== 'function') {
        ecomet_util.parse_filter=parseFilter;
    }

    if (typeof ecomet_util.isKeyword !== 'function') {
        ecomet_util.isKeyword=isKeyword;
    }

    if (typeof ecomet_util.checkKeyword !== 'function') {
        ecomet_util.checkKeyword=checkKeyword;
    }

    // Transform fields from ecomet format to kendo
    if (typeof ecomet_util.kendo_util.toKendoFields !== 'function') {
        ecomet_util.kendo_util.toKendoFields = function (fields,schema){
            schema=schema||{};
            const namesMap=Object.keys(schema).reduce((acc,f)=>{
                if (schema[f].name){
                    acc[schema[f].name]=f;
                }
                return acc;
            },{});
            fields=Object.keys(fields).reduce((acc,name)=>{
                // Coerce primitives
                let value=toKendoValue(fields[name]);
                // If decoding for the field is defined apply it
                if ((schema[name]!==undefined)&&(typeof schema[name].decode==='function')){
                    value=schema[name].decode(value,fields);
                }
                if (namesMap[name]){
                    name=namesMap[name];
                }else if(name.startsWith(".")){
                    // System fields in ecomet start with '.' symbol
                    // kendo does not accept such names so that we replace
                    // '.' with '_'
                    name="_"+name.slice(1);
                }
                acc[name]=value;
                return acc
            },{});
            // Calculated fields
            Object.keys(schema).forEach(name=>{
                if (typeof schema[name].calculated==='function'){
                    fields[name]=schema[name].calculated(fields);
                }
            });
            return fields;
        }
    }
    
    // Transform fields from kendo format to ecomet
    if (typeof ecomet_util.kendo_util.toEcometFields !== 'function') {
        ecomet_util.kendo_util.toEcometFields = function (fields,schema){
            schema=schema||{};
            return Object.keys(fields)
                .filter(name=>{
                    // filter out calculated fields
                    return (schema[name]&&schema[name].calculated)===undefined
                })
                .reduce((acc,name)=>{
                    // Coerce primitives
                    let value=toEcometValue(fields[name]);
                    // If encoding for the field is defined apply it
                    if ((schema[name]!==undefined)&&(typeof schema[name].encode==='function')){
                        value=schema[name].encode(value,fields);
                    }
                    if (schema[name] && schema[name].name){
                        name=schema[name];
                    }else if (name.startsWith("_")){
                        name="."+name.slice(1);
                    }
                    acc[name]=value;
                    return acc;
                },{});
        }
    }

    if (typeof ecomet_util.kendo_util.toEcometFilter !== 'function') {
        ecomet_util.kendo_util.toEcometFilter = function (filter){
            return parseFilter(filter);
        }
    }


    class EcometKendoDatasource extends kendo.data.DataSource{
        constructor (Params){
            let _own={
                fields:undefined,
                connection:undefined,
                baseFilter:undefined,
                subscribe:false,
                timeout:300000
            };
            // Remove own params from the common heap
            Object.keys(_own).forEach(p=>{
                if (Params[p]!==undefined){
                    _own[p]=Params[p];
                    delete Params[p];
                }
            });

            super({...Params,...{
                    schema:{
                        total:"total",
                        data:"set",
                        parse:result=>{ return this.__parse_result(result) },
                        model:{
                            id:"oid",
                            fields:{..._own.fields,...{
                                "oid":{type:"string"},
                                "__ecometData_":{type:"object"}
                            }}
                        }
                    },
                    transport:{
                        read:e=>{ return this.__read(e) },
                        create:e=>{ return this.__create(e) },
                        update:e=>{ return this.__update(e) },
                        destroy:e=>{ return this.__destroy(e) }
                    }
                }});
            this.__own=_own;
            this.bind("change",e=>{
                // On adding a new object we identify it by its uid first,
                // when the server has handled a create request it returns actual oid for the
                // created object and we will update it
                if (e.action==="add"){
                    e.items.forEach(item=>{
                        item.oid=item.uid;
                    });
                }
            })
        }

        find(filter){
            return this.filter(filter);
        }

        baseFilter(filter){
            this.__own.baseFilter=filter;
        }

        setOptions(options){
            // If fields were changed we need to update the schema model
            if (options.fields!==undefined){
                this.options.schema.model.fields={...options.fields,...{oid:{type:"string"}}};
            }
            // Remove own params from the common heap
            Object.keys(this.__own).forEach(p=>{
                if (options[p]!==undefined){
                    this.__own[p]=options[p];
                    delete options[p];
                }
            });

            // Update the kendo relating options
            this.options={...this.options,...options};
        }

        destroy(){
            if (this.__subscription!==undefined){
                this.__own.connection.unsubscribe(this.__subscription);
            }
        }

        __parse_result(result){
            if (typeof result!=="object"){ return result; }
            let set=result.set.map(({oid,fields})=>{
                return {...{oid,"__ecometData_":fields},...ecomet_util.kendo_util.toKendoFields(fields,this.__own.fields)}
            });
            return {total:result.total,set};
        }

        __read(e){
            if (!this.__own.connection){ return e.error("undefined connection"); }

            let filter=[parseFilter(this.__own.baseFilter)];
            //----------Server filtering---------------------
            if (this.options.serverFiltering&&e.data.filter){
                if (e.data.filter.logic && e.data.filter.filters.length===0){
                    console.warn("empty logic filter for datasource");
                }else{
                    filter.push(parseFilter(e.data.filter));
                }
            }
            filter=filter.length>1?"AND("+filter.join(",")+")":filter[0];

            //----------Server paging---------------------------
            let page="";
            if (this.options.serverPaging&&!this.__own.subscribe&&(e.data.page!==undefined)){
                page="PAGE "+e.data.page+":"+e.data.pageSize;
            }

            //---------Sorting----------------------------------
            let order="";
            if (this.options.serverSorting&&e.data.sort&&!this.__own.subscribe&&(e.data.sort!==undefined)){
                // Currently ecomet only supports sorting by oid
                let sort=e.data.sort;
                sort = sort.map(({field,dir})=>field+" "+dir);
                order="ORDER by "+sort.join(",");
            }

            //--------BUILD THE QUERY-----------------
            let query=[
                "GET",
                Object.keys(this.__own.fields)
                    .filter(name=>this.__own.fields[name].calculated===undefined)
                    .map(name=>{
                        if (this.__own.fields[name] && this.__own.fields[name].name){
                            let tmpname = this.__own.fields[name].name;
                            let validname = checkKeyword(tmpname);
                            name = `${validname} as '${name}'`
                        } else if (name.startsWith("_")){
                            name = "."+ name.slice(1);
                        } else {
                            name = checkKeyword(name);
                        }
                        return name;
                    }).join(","),
                "FROM * WHERE",
                filter,
                page,
                order
            ].join(" ");

            if (!this.__own.subscribe){
                //--------The ordinary search query-------------------
                this.__own.connection.find(query,result=>{
                    e.success(result);
                },error=>{
                    console.error("invalid query",query,error);
                    e.error("read result","error",error);
                },this.__own.timeout);
            }else{
                //-------The subscription query------------------------
                if (this.__subscription!==undefined){
                    this.__own.connection.unsubscribe(this.__subscription);
                }
                this.__subscription=this.__own.connection.subscribe(query,item=>{
                    // Create a new object
                    item.fields={
                        ...ecomet_util.kendo_util.toKendoFields(item.fields,this.__own.fields),
                        ...{oid:item.oid,id:item.id,"__ecometData_":item.fields}
                    };
                    if (!this.get(item.oid)){
                        this.pushCreate(item.fields);
                        // Kendo bug. When we add a new item through pushCreate it ignores
                        // the model configuration and sets oid to the generated uid.
                        // With this operation we fix it
                        this.get(item.fields.oid).oid=item.fields.oid;
                    }else{
                        this.pushUpdate(item.fields);
                    }
                },item=>{
                    // Update an existing object
                    let fields=this.get(item.oid);
                    if (fields===undefined||fields===null) { return; }
                    item.fields={
                        ...{oid:item.oid,"__ecometData_":{...fields["__ecometData_"],...item.fields}},
                        ...ecomet_util.kendo_util.toKendoFields(item.fields,this.__own.fields)
                    };
                    this.pushUpdate(item.fields);
                },item=>{
                    // Remove object
                    this.pushDestroy({oid:item.oid});
                },error=>{
                    e.error("subscribe ","error",error);
                });
                // Start from empty set
                e.success({total:0,set:[]});
            }

        }

        __create(e){
            let uid=e.data.oid;
            delete e.data.oid;
            delete e.data.__ecometData_;
            const fields=ecomet_util.kendo_util.toEcometFields(e.data,this.__own.fields);
            this.__own.connection.create_object(fields,oid=>{
                let item=this.getByUid(uid);
                item.set("id",oid);
                item.set("oid",oid);
                item.dirty=false;
                item.set("__ecometData_",fields);
                e.success();
            },e.error,this.__own.timeout);
        }

        __update(e){
            // Copy of fields
            let fields=Object.assign({},e.data);
            const {oid,__ecometData_}=fields;
            delete fields.oid;
            delete fields.__ecometData_;
            fields=ecomet_util.kendo_util.toEcometFields(fields,this.__own.fields);
            fields=Object.keys(fields).reduce((acc,f)=>{
                if (fields[f]!==__ecometData_[f]){ acc[f]=fields[f]; }
                return acc;
            },{});
            this.__own.connection.edit_object(oid,fields,e.success,e.error);
        }

        __destroy(e){
            this.__own.connection.delete_object(e.data.oid,e.success,e.error);
        }

    }

    // Transform the filter from kendo format to ecomet
    function parseFilter(filter){
        // Grouping operations
        if (filter.logic!==undefined){
            if (!Array.isArray(filter.filters)){ throw "invalid filter for datasource"; }
            if (filter.filters.length===0){ throw "empty filters for logic"; }
            let logic=filter.logic.toUpperCase();
            return logic+"("+filter.filters.map(leaf=>{
                return parseFilter(leaf);
            }).join(",")+")";
        // Leaf condition
        } else{
            // System fields in ecomet start with '.' symbol
            // kendo does not accept such names so that we replace
            // '.' with '_'
            let name=filter.field;
            if (name.startsWith("_")){
                name="."+name.slice(1);
            }
            // Value
            let value=filter.value;
            if (typeof value==="string"){
                if (value.startsWith("'")){
                    value=value.substr(1);
                }else if (!value.startsWith("$")){
                    if (filter.operator==="startswith" || filter.operator===":startswith"){
                        value="'^"+value+"'";
                    }else{
                        value="'"+value+"'";
                    }
                }
            }
            //Operator
            let operator=operatorMap[filter.operator];
            if (!operator){ throw "invalid operator "+filter.operator; }

            if (operator==="[]"){
                if (!Array.isArray(value)){ throw "invalid value for interval search "+value }
                const from = (typeof value[0]==='string')?"'"+value[0]+"'":value[0];
                const to = (typeof value[1]==='string')?"'"+value[1]+"'":value[1];
                return name +" [" +from+":"+to+"]"
            }else{
                return name + operator + value;
            }
        }
    }

    const operatorMap={
        "eq":"=",
        "gte":">=",
        "lte":"<=",
        "contains":" like ",
        "startswith":" like ",
        ":contains":" :like ",
        ":startswith":" :like ",
        "[]":"[]"
    };

    const keywords = new Set(["AND", "ANDNOT", "AS", "BY", "DELETE", "DESC", "GROUP","GET","FROM","SUBSCRIBE","UNSUBSCRIBE",
        "INSERT","UPDATE","LOCK","OR","ORDER","PAGE","READ", "SET","IN","TRANSACTION_START","TRANSACTION_COMMIT",
        "TRANSACTION_ROLLBACK","WHERE","WRITE","STATELESS","NO_FEEDBACK","FORMAT","TEXT","HEX","COMMENT_MULTILINE",
        "WHITESPACE","INTNUM","FLOATDEC","FLOATSCI","FIELD","ATOM","S","ALL","EQ","EQS","GTS","LTS","GTES","LTES","NES",
        "LIKE","LIKES","OPEN","CLOSE","LIST_OPEN","LIST_CLOSE","COMMA","SEMICOLON","COLON"]);

    function isKeyword(word){
        return keywords.has(word.toUpperCase());
    }

    function checkKeyword(word) {
        return isKeyword(word)? `'${word}'` : word;
    }

    const encodeMap={
      "":null,
      undefined:null,
      null:null,
      true:true,
      false:false
    };
    function toEcometValue(value){
      if (encodeMap[value]!==undefined){ return encodeMap[value]; }
        if (Array.isArray(value)){
            return value.map(toEcometValue);
        }
        return value;
    }

    const decodeMap={
      null:null,
      false:false,
      true:true
    };
    function toKendoValue(value){
        if (decodeMap[value]!==undefined){ return decodeMap[value]; }
        if (Array.isArray(value)){
            return value.map(toKendoValue);
        }
        return value;
    }

}());

export default ecomet_util;
