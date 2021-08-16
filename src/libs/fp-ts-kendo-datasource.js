//-----------------------------------------------------------------
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2019, Vozzhenikov Roman
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

// archives argument has the next format:
// [
//      {archive:"/root/PROJECT/ARCHIVES/my_archive",aggregate:"sum",name:"some caption"},
//      {archive:"/root/PROJECT/ARCHIVES/another_archive",aggregate:"mean",name:"next caption"}
// ]

import kendo from "@progress/kendo-ui";

class TS_Datasource {
    constructor(connection,archives,options) {
        this._connection=connection;
        this._archives=undefined;
        this._names=undefined;
        this.set_archives(archives);
        // Defaults
        this._defaults={
            processing:undefined,
            timeout:60000,
            error:undefined,
            kendo:{}
        };
        this._options={...this._defaults,...options};

        this._datasource=this._init_datasource();
    }

    set_archives(archives){
        if (!Array.isArray(archives)){
            this._archives=undefined;
            this._names=undefined;
            return;
        }
        // Prepare data for query
        this._archives=parse_archives(archives);

        function parse_archives(items){
            return items.map(({archive,aggregate,join})=>{
                let item=[archive,aggregate];
                if (join!==undefined){
                    item.push(parse_archives(join));
                }
                return item;
            });
        }
        this._names=["date"].concat(archives.map(({name})=> name));
        if (this._datasource!==undefined){
            this._datasource.read();
        }
    }

    set_connection(connection){
        this._connection=connection;
    }

    set_options(options){
        this._options={...this._options,...options};
    }

    datasource(){
        return this._datasource;
    }

    _init_datasource(){
        let _this=this;
        let _options={...this._options.kendo,...{
            serverFiltering:true,
            error:this._options.error
        }};
        // Visualization for waiting for a server response
        if (this._options.processing!==undefined){
            _options.requestStart=function () {
                kendo.ui.progress(this._options.processing, true);
            };
            _options.requestEnd=function () {
                kendo.ui.progress(this._options.processing, false);
            };
        }
        _options.transport={
            read:read
        };

        //--------------The query---------------------
        function read(options) {
            if (_this._connection===undefined){ return options.error("undefined connection"); }
            if (_this._archives===undefined){ return options.error("undefined archives"); }
            //-------extract filter--------------------
            let query=options.data.filter;
            if (query===undefined){ return options.error("undefined filter"); }
            query=query.filters;
            if (query===undefined){ return options.error("undefined filter"); }
            // Check if the filter in complex format
            if (typeof query[0]==="object"){
                query=query[0];
            }
            if (query===undefined){ return options.error("undefined filter"); }
            if (Array.isArray(query)){
                query={"archives":_this._archives,"points":query};
            }else{
                query={"archives":_this._archives,"periods":query};
            }
            //-------server request----------------------
            _this._connection.application("fp_json","read_archives",query,function(data){
                //Transform data to kendo format
                options.success(data.map(row=>{
                    return row.reduce((acc,v,i)=>{
                        if (i===0){ v=new Date(v); }
                        if (v==="none"){ v=null; }
                        acc[_this._names[i]]=v;
                        return acc;
                    },{});
                }));
            },error=>{
                console.error("ts_datasource",error);
                options.error(error);
            },_this._options.timeout);
        }

        // kendo datasource
        return new kendo.data.DataSource(_options);
    }

}

export default TS_Datasource;

