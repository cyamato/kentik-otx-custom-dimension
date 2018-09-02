var Promise = require('promise');
var https = require('https');

var apiToken = '';
var apiEmail = '';

// Device Class Constructor
function Device () {
    this.id = null;
    this.company_id = null;
    this.device_name = null;
    this.device_description = null;
    this.device_type = "router";
    this.device_snmp_ip = null;
    this.device_snmp_community = null;
    this.device_flow_type = "ipfix";
    this.device_bgp_password = null;
    this.device_bgp_type = "none";
    this.device_bgp_neighbor_ip = null;
    this.device_bgp_neighbor_asn = null;
    this.use_bgp_device_id = null;
    this.device_sample_rate = null;
    this.sending_ips = [null];
    this.created_date = null;
    this.updated_date = null;
    this.minimize_snmp = false;
    this.site_id = null;
    this.custom_columns = null;
    this.endpoint = {
        "list": {
            "host": 'api.kentik.com',
            "path": '/api/v5/devices',
            "method": 'GET',
        },
        "info": {
            "host": 'api.kentik.com',
            "path": '/api/v5/device/',   // +device.id,
            "method": 'GET',
        },
        "create": {
            "host": 'api.kentik.com',
            "path": '/api/v5/device/',
            "method": 'POST',
        },
        "update": {
            "host": 'api.kentik.com',
            "path": '/api/v5/device/',   // +device.id,
            "method": 'PUT',
        },
        "delete": {
            "host": 'api.kentik.com',
            "path": '/api/v5/device/',   // +device.id,
            "method": 'DELETE',
        }
    };
}

// Device Class Methods
Device.prototype.list = function () { 
    console.log ("Getting List of Devices from Kentik API");
    return new Promise((resolve, reject) => {
        apiCall(this.endpoint.list, null).then((value) => {
            console.log("API Call Sucsess...");
            resolve(value);
        },
        (reason) => {
            console.log("API Call Failed...");
            reject(reason);
        });
    });
},
Device.prototype.info = function () {
    return new Promise((resolve, reject) => {
        if (!this.id > null) {
            reject( new Error("device.id not set"));
            return;
        }
        
        this.endpoint.info.path += this.id;
        apiCall(this.endpoint.info, null).then( (value) => {
            resolve(value);
        },
        (reson) => {
            reject(reson);
        });
    });
};
Device.prototype.save = function () {
    return new Promise( (resolve, reject) => {
        // Check that setting are correct
        if (!this.device_name) {
            reject(new Error('required field device_name dose a correct value'));
            return;
        }
        if (this.device_type != 'router' && 
            this.device_type != 'host-nprobe-basic') {
            reject(new Error('required field device_type dose a correct value'));
            return;
        }
        if (this.device_flow_type != 'sflow' && 
            this.device_flow_type != 'netflow.v5' && 
            this.device_flow_type != 'netflow.v9' && 
            this.device_flow_type != 'ipfix') {
            reject(new Error('required field device_flow_type dose a correct value'));
            return;
        } 
        if (this.device_sample_rate < 1 && 
            this.device_sample_rate > 4294967295) {
            reject(new Error('required field device_sample_rate dose a correct value'));
            return;
        } 
        if (this.minimize_snmp != true && 
            this.minimize_snmp != false) {
            reject(new Error('required field minimize_snmp dose a correct value'));
            return;
        } 
        if (this.device_bgp_type != 'none' && 
            this.device_bgp_type != 'device' && 
            this.device_bgp_type != 'other_device') {
            reject(new Error('required field device_bgp_type dose a correct value'));
            return;
        } 
        
        // Setup data - Device JSON object
        var data = {"device": {
            "device_name": this.device_name,
            "device_type": this.device_type,
            "device_flow_type": this.device_flow_type,
            "device_sample_rate": this.device_sample_rate,
            "sending_ips": this.sending_ips,
            "minimize_snmp": this.minimize_snmp,
            "device_bgp_type": this.device_bgp_type,
        }};
        
        if (this.company_id) {
            data.device.company_id = this.company_id;
        }
        if (this.device_description) {
            data.device.device_description = this.device_description;
        }
        if (this.device_snmp_ip) {
            data.device.device_snmp_ip = this.device_snmp_ip;
        }
        if (this.device_snmp_community) {
            data.device.device_snmp_community = this.device_snmp_community;
        }
        if (this.device_bgp_password) {
            data.device.device_bgp_password = this.device_bgp_password;
        }
        if (this.device_bgp_neighbor_ip) {
            data.device.device_bgp_neighbor_ip = this.device_bgp_neighbor_ip;
        }
        if (this.device_bgp_neighbor_asn) {
            data.device.device_bgp_neighbor_asn = this.device_bgp_neighbor_asn;
        }
        if (this.use_bgp_device_id) {
            data.device.use_bgp_device_id = this.use_bgp_device_id;
        }
        if (this.site_id) {
            data.device.site_id = this.site_id;
        }
        if (this.custom_columns) {
            data.device.custom_columns = this.custom_columns;
        }
        
        apiCall(this.endpoint.create, data).then( (value) => {
            this.id = value.id;
            resolve(value);
        }, (reson) => {
            reject(reson);
        });
    });
};
Device.prototype.update = function () {
    return new Promise( (resolve, reject) => {
        if (!this.id > null) {
            reject(new Error('required fields do not have needed or correct values'));
            return;
        }
        
        var data = {
            "id": this.id,
        };
        
        for (var prop in this) {
            if (this.hasOwnProperty(prop)) {
                switch (prop) {
                    case "company_id": 
                        data.company_id = this.company_id;
                        break;
                    case "device_name": 
                        data.device_name = this.device_name;
                        break;
                    case "device_description": 
                        data.device_description = this.device_description;
                        break;
                    case "device_type":
                        if (this.device_type != 'router' && this.device_type != 'host-nprobe-basic') {
                            reject(new Error('required fields do not have needed or correct values'));
                            return;
                        }
                        data.device_type = this.device_type;
                        break;
                    case "device_snmp_ip": 
                        data.device_snmp_ip = this.device_snmp_ip;
                        break;
                    case "device_snmp_community": 
                        data.device_snmp_community = this.device_snmp_community;
                        break;
                    case "device_flow_type":
                        if (this.device_flow_type != 'sflow' && this.device_flow_type != 'netflow.v5' && this.device_flow_type != 'netflow.v9' && this.device_flow_type != 'ipfix') {
                            reject(new Error('required fields do not have needed or correct values'));
                            return;
                        }
                        data.device_flow_type = this.device_flow_type;
                        break;
                    case "device_bgp_password": 
                        data.device_bgp_password = this.device_bgp_password;
                        break;
                    case "device_bgp_type": 
                        if (this.device_bgp_type != 'none' && this.device_bgp_type != 'device' && this.device_bgp_type != 'other_device') {
                            reject(new Error('required fields do not have needed or correct values'));
                            return;
                        }
                        data.device_bgp_type = this.device_bgp_type;
                        break;
                    case "device_bgp_neighbor_ip": 
                        data.device_bgp_neighbor_ip = this.device_bgp_neighbor_ip;
                        break;
                    case "device_bgp_neighbor_asn": 
                        data.device_bgp_neighbor_asn = this.device_bgp_neighbor_asn;
                        break;
                    case "use_bgp_device_id": 
                        data.use_bgp_device_id = this.use_bgp_device_id;
                        break;
                    case "device_sample_rate":
                        if (this.device_sample_rate < 1 && this.device_sample_rate > 4294967295) {
                            reject(new Error('required fields do not have needed or correct values'));
                            return;
                        }
                        data.device_sample_rate = this.device_sample_rate;
                        break;
                    case "sending_ips": 
                        data.sending_ips = this.sending_ips;
                        break;
                    case "created_date": 
                        data.created_date = this.created_date;
                        break;
                    case "updated_date": 
                        data.updated_date = this.updated_date;
                        break;
                    case "minimize_snmp":
                        if (this.minimize_snmp != true && this.minimize_snmp != false) {
                            reject(new Error('required fields do not have needed or correct values'));
                            return;
                        }
                        data.minimize_snmp = this.minimize_snmp;
                        break;
                    case "site_id": 
                        data.site_id = this.site_id;
                        break;
                    case "custom_columns": 
                        data.custom_columns = this.custom_columns;
                        break;
                    default:
                        break;
                }
            }
        }
        
        apiCall(this.endpoint.create, data).then( function (value) {
            this.id = value.id;
            this.company_id = value.company_id;
            this.device_name = value.device_name;
            this.device_description = value.device_description;
            this.device_type = value.device_type;
            this.device_snmp_ip = value.device_snmp_ip;
            this.device_snmp_community = value.device_snmp_community;
            this.device_flow_type = value.device_flow_type;
            this.device_bgp_password = value.device_bgp_password;
            this.device_bgp_type = value.device_bgp_type;
            this.device_bgp_neighbor_ip = value.device_bgp_neighbor_ip;
            this.device_bgp_neighbor_asn = value.device_bgp_neighbor_asn;
            this.use_bgp_device_id = value.use_bgp_device_id;
            this.device_sample_rate = value.device_sample_rate;
            this.sending_ips = [value.sending_ips];
            this.created_date = value.created_date;
            this.updated_date = value.updated_date;
            this.minimize_snmp = value.minimize_snmp;
            this.site_id = value.site_id;
            this.custom_columns = value.custom_columns;
            resolve(value);
        }, function (reson) {
            reject(reson);
        });
    });        
};
Device.prototype.delete = function () {
    return new Promise( (resolve, reject) => {
        if (!this.id > null) {
            reject(new Error('required fields do not have needed or correct values'));
            return;
        }
        
        var data = {
            "id": this.id,
        };
        
        apiCall(this.endpoint.create, data).then( function (value) {
            this.id = null;
            this.company_id = null;
            this.device_name = null;
            this.device_description = null;
            this.device_type = null;
            this.device_snmp_ip = null;
            this.device_snmp_community = null;
            this.device_flow_type = null;
            this.device_bgp_password = null;
            this.device_bgp_type = null;
            this.device_bgp_neighbor_ip = null;
            this.device_bgp_neighbor_asn = null;
            this.use_bgp_device_id = null;
            this.device_sample_rate = null;
            this.sending_ips =  [null];
            this.created_date = null;
            this.updated_date = null;
            this.minimize_snmp = null;
            this.site_id = null;
            this.custom_columns = null;
            resolve(value);
        }, function (reson) {
            reject(reson);
        });
    });
};

// Saved Filter Constructor
function SavedFilter () {
    this.filter_name = "";
    this.filter_description = "";
    this.filters = {
        connector: "All",
        filterGroups: [
            {
                connector: "All",
                filters: [
                    {
                        filterField: "",
                        operator: "",
                        filterValue: ""
                    }    
                ],
                not: false,
            }
        ]
    };
    this.endpoint = {
        "create": {
            "host": 'api.kentik.com',
            "path": '/api/v5/saved-filter/custom',
            "method": 'POST',
        },
    };
}

// Saved Filter Methods
SavedFilter.prototype.save = function () {
    return new Promise( (resolve, reject) => {
        var data = {
            filter_name: this.filter_name,
            filter_description: this.filter_description,
            filters: this.filters
        };
        
        apiCall(this.endpoint.create, data).then( (value) => {
            // TODO: Update Populator
            resolve(value);
        }, (reson) => {
            reject(reson);
        });
    });
};

// Populators Class Constructor
function Populators (dimension, token, userEmail) {
    apiToken = token || null;
    apiEmail = userEmail || null;
    
    this.parent_dimension = null;
    this.id = null;
    this.dimension_id = null;
    this.value = null;
    this.direction = null;
    this.device_name = null;
    this.interface_name = null;
    this.addr = null;
    this.port = null;
    this.tcp_flags = null;
    this.protocol = null;
    this.asn = null;
    this.nexthop_asn = null;
    this.bgp = null;
    this.bgp_community = null;
    this.user = null;
    this.created_date = null;
    this.updated_date = null;
    this.company_id = null;
    this.endpoint = {
        "create": {
            "host": 'api.kentik.com',
            "path": '/api/v5/customdimension/',  // + dimension_id + /populator
            "method": 'POST',
        },
        "update": {
            "host": 'api.kentik.com',
            "path": '/api/v5/customdimension/',   // + dimension_id + /populator + /populator_id
            "method": 'PUT',
        },
        "delete": {
            "host": 'api.kentik.com',
            "path": '/api/v5/customdimension/',   //+ dimension_id + /populator + /populator_id
            "method": 'DELETE',
        }
    };
}

// Populators Class Methods
Populators.prototype.save = function () {
    console.log("Calling Populator Create API");
    return new Promise( (resolve, reject) => {
        if (this.id) {  //  If Populater has an ID then we call update as it already exisits
            
        }
        
        var data = {
            dimension_id: this.dimension_id,
            value: this.value,
            direction: this.direction,
        };
        
        if (this.device_name) {
            data.device_name = this.device_name;
        }
        
        if (this.interface_name) {
            data.interface_name = this.interface_name;
        }
            
        if (this.addr) {
            data.addr = this.addr;
        }
            
        if (this.port) {
            data.port = this.port;
        }
            
        if (this.tcp_flags) {
            data.tcp_flags = this.tcp_flags;
        }
            
        if (this.protocol) {
            data.protocol = this.protocol;
        }
            
        if (this.asn) {
            data.asn = this.asn;
        }
            
        if (this.nexthop_asn) {
            data.nexthop_asn = this.nexthop_asn;
        }
            
        if (this.bgp) {
            data.bgp = this.bgp;
        }
            
        if (this.bgp_community) {
            data.bgp_community = this.bgp_community;
        }
        
        this.endpoint.create.path += this.dimension_id + "/populator";
        
        data = { "populator": data};
        
        apiCall(this.endpoint.create, data).then( (value) => {
            // TODO: Update Populator
            resolve(value);
        }, (reson) => {
            reject(reson);
        });
    });
};
Populators.prototype.update = function () {
    return new Promise( function (resolve, reject) {
        if (!this.parent_dimension ||
            (
                (this.parent_dimension.type == 'string' && !this.value.match('/^[a-zA-Z0-9\s-_]{12}$')) || 
                (this.parent_dimension.type == 'uint32' && Number.isInteger(this.value) && this.value < 0 || this.value > 4294967295)
            ) ||
            (
                (this.id && this.direction != "src" && this.direction != "dst") ||
                (!this.id && this.direction != "src" && this.direction != "dst" && this.direction  != "both")
            )|| 
            (this.addr && !this.addr.match('^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(\/(([1-2][0-9])|(3[0-2])|(0[0-9])|[1-9]|))?$')) ||
            (this.tcp_flags && Number.isInteger(this.tcp_flags) && this.tcp_flags < 0 || this.tcp_flags > 255)
        ) {
            throw new Error('not all properties set correctly');
        }
        
        if (this.id) {  //  If Populater has an ID then we call update as it already exisits
            
        }
        
        var data = {
            dimension_id: this.dimension_id,
            value: this.value,
            direction: this.direction,
        };
        
        if (this.device_name) {
            data.device_name = this.device_name;
        }
        
        if (this.interface_name) {
            data.interface_name = this.interface_name;
        }
            
        if (this.addr) {
            data.addr = this.addr;
        }
            
        if (this.port) {
            data.port = this.port;
        }
            
        if (this.tcp_flags) {
            data.tcp_flags = this.tcp_flags;
        }
            
        if (this.protocol) {
            data.protocol = this.protocol;
        }
            
        if (this.asn) {
            data.asn = this.asn;
        }
            
        if (this.nexthop_asn) {
            data.nexthop_asn = this.nexthop_asn;
        }
            
        if (this.bgp) {
            data.bgp = this.bgp;
        }
            
        if (this.bgp_community) {
            data.bgp_community = this.bgp_community;
        }
        
        
        for (var prop in this) {
            if (this.hasOwnProperty(prop)) {
                if (prop)
                switch (prop) {
                    
                }
            }
        }
    });
};
Populators.prototype.delete = function () {
    console.log ("Deleting a Populator with the Kentik API");
    return new Promise((resolve, reject) => {
        if (!this.id) {
            reject("Populators.id not set");
            return;
        }
        if (!this.dimension_id) {
            reject("dimension_id.id not set");
            return;
        }
        this.endpoint.delete.path += this.dimension_id + "/populator/" + this.id;
        
        apiCall(this.endpoint.delete, null).then((value) => {
            console.log("API Call Sucsess...");
            resolve(value);
        },
        (reson) => {
            console.log("API Call Failed...");
            reject(reson);
        });
    });
};

// Dimension Class Constructor
function Dimension (token, userEmail) {
    apiToken = token || null;
    apiEmail = userEmail || null;
    
    this.id = null;
    this.display_name = null;
    this.name = null;
    this.type = "string";
    this.populators = [];
    this.created_date = null;
    this.updated_date = null;
    this.company_id = null;
    this.endpoint = {
        "list": {
            "host": 'api.kentik.com',
            "path": '/api/v5/customdimensions',
            "method": 'GET',
        },
        "info": {
            "host": 'api.kentik.com',
            "path": '/api/v5/customdimension/',   // +dimension.id,
            "method": 'GET',
        },
        "create": {
            "host": 'api.kentik.com',
            "path": '/api/v5/customdimension/',
            "method": 'POST',
        },
        "update": {
            "host": 'api.kentik.com',
            "path": '/api/v5/customdimension/',   // +dimension.id,
            "method": 'PUT',
        },
        "delete": {
            "host": 'api.kentik.com',
            "path": '/api/v5/customdimension/',   // +dimension.id,
            "method": 'DELETE',
        }
    };
}

// Dimension Class Methods
Dimension.prototype.list = function () { 
    console.log ("Getting List of Dimension from Kentik API");
    return new Promise((resolve, reject) => {
        apiCall(this.endpoint.list, null).then((value) => {
            console.log("API Call Sucsess...");
            resolve(value);
        },
        (reason) => {
            console.log("API Call Failed...");
            reject(reason);
        });
    });
};
Dimension.prototype.info = function () { 
    console.log ("Getting a Dimension from Kentik API");
    return new Promise((resolve, reject) => {
        if (!this.id) {
            reject("Missing Dimension ID");
            return;
        }
        
        this.endpoint.info.path += this.id;
        
        apiCall(this.endpoint.info, null).then((value) => {
            console.log("API Call Sucsess...");
            resolve(value);
        },
        (reason) => {
            console.log("API Call Failed...");
            reject(reason);
        });
    });
};
Dimension.prototype.save = function () {
    console.log ("Creating a Dimension with the Kentik API");
    
    return new Promise((resolve, reject) => {
        if (!this.name) {
            reject("customDimension.name not set");
            return;
        }
        if (!this.type) {
            reject("customDimension.type not set");
            return;
        }
        if (!this.display_name) {
            this.display_name = this.name;
        }
        var new_cd = {
            "name": this.name,
            "type": this.type,
            "display_name": this.display_name 
        };
        apiCall(this.endpoint.create, new_cd).then((value) => {
            console.log("API Call Sucsess...");
            resolve(value);
        },
        (reson) => {
            console.log("API Call Failed...");
            reject(reson);
        });
        
    });
};
Dimension.prototype.update = function () {
    console.log ("Updating a Dimension with the Kentik API");
    return new Promise((resolve, reject) => {
        if (!this.id) {
            reject("customDimension.id not set");
            return;
        }
        if (!this.display_name) {
            reject("customDimension.display_name not set");
            return;
        }
        
        this.endpoint.update.path += this.id;
        
        var cd = {
            "display_name": this.display_name 
        };
        
        apiCall(this.endpoint.update, cd).then((value) => {
            console.log("API Call Sucsess...");
            resolve(value);
        },
        (reson) => {
            console.log("API Call Failed...");
            reject(reson);
        });
        
    });
};
Dimension.prototype.delete = function () {
    console.log ("Deleting a Dimension with the Kentik API");
    return new Promise((resolve, reject) => {
        if (!this.id) {
            reject("customDimension.id not set");
            return;
        }
        this.endpoint.delete.path += this.id;
        
        apiCall(this.endpoint.delete, null).then((value) => {
            console.log("API Call Sucsess...");
            resolve(value);
        },
        (reson) => {
            console.log("API Call Failed...");
            reject(reson);
        });
    });
};

// User Class Constructor
function User (token, userEmail) {
    apiToken = token || null;
    apiEmail = userEmail || null;
    
    this.id = null;
    this.username = null;
    this.user_full_name = null;
    this.user_email = null;
    this.role = "member";
    this.email_service = false;
    this.email_product = false;
    this.last_login = null;
    this.created_date = null;
    this.updated_date = null;
    this.company_id = null;

    this.endpoint = {
        "list": {
            "host": 'api.kentik.com',
            "path": '/api/v5/users',
            "method": 'GET',
        },
        "info": {
            "host": 'api.kentik.com',
            "path": '/api/v5/user/',   // +user.id,
            "method": 'GET',
        },
        "create": {
            "host": 'api.kentik.com',
            "path": '/api/v5/user/',
            "method": 'POST',
        },
        "update": {
            "host": 'api.kentik.com',
            "path": '/api/v5/user/',   // +user.id,
            "method": 'PUT',
        },
        "delete": {
            "host": 'api.kentik.com',
            "path": '/api/v5/user/',   // +user.id,
            "method": 'DELETE',
        }
    };
}

// User Class Methods
User.prototype.list = function () { 
    console.log ("Getting List of Users from Kentik API");
    return new Promise((resolve, reject) => {
        apiCall(this.endpoint.list, null).then((value) => {
            console.log("API Call Sucsess...");
            resolve(value);
        },
        (reason) => {
            console.log("API Call Failed...");
            reject(reason);
        });
    });
};
User.prototype.info = function () { 
    console.log ("Getting a User from Kentik API");
    return new Promise((resolve, reject) => {
        if (!this.id) {
            reject("Missing User ID");
            return;
        }
        
        this.endpoint.info.path += this.id;
        
        apiCall(this.endpoint.info, null).then((value) => {
            console.log("API Call Sucsess...");
            resolve(value);
        },
        (reason) => {
            console.log("API Call Failed...");
            reject(reason);
        });
    });
};
User.prototype.save = function () {
    console.log ("Creating a User with the Kentik API");
    
    return new Promise((resolve, reject) => {
        if (!this.username) {
            reject("User.username not set");
            return;
        }
        if (!this.user_full_name) {
            reject("User.user_full_name not set");
            return;
        }
        if (!this.user_email) {
            reject("User.user_email not set");
            return;
        }
        if (!this.user_password) {
            reject("User.user_password not set");
            return;
        }
        
        var new_user = {
            "user": {
                "user_name": this.username,
                "user_full_name": this.user_full_name,
                "user_email": this.user_email,
                "user_password": this.user_password,
                "role": this.role,
                "email_service": this.email_service,
                "email_product": this.email_product
            } 
        };
        apiCall(this.endpoint.create, new_user).then((value) => {
            console.log("API Call Sucsess...");
            value.username = value.user.user_name;
            this.id = value.user.id;
            resolve(value);
        },
        (reson) => {
            console.log("API Call Failed...");
            reject(reson);
        });
        
    });
};
// ToDo add update and delete

var apiCall = function (endpoint, tx_data) {
    return new Promise((resolve, reject) => {
        console.log("\x1b[1m\x1b[32m", "Making API Call");
        console.log();
        console.log("\x1b[1m\x1b[32m", "Setting Up Options");
        var options = {
            hostname: endpoint.host,
            port: 443,
            path: endpoint.path,
            method: endpoint.method,
            headers: {
                'content-type': 'application/json',
                'X-CH-Auth-API-Token': apiToken,
                'X-CH-Auth-Email': apiEmail
            }
        };
        
        if (endpoint.method == "POST" || endpoint.method == "PUT") {
            options.headers['content-length'] = Buffer.byteLength(JSON.stringify(tx_data));
        }
        
        // console.log("\x1b[0m\x1b[37m", options);
        console.log();
        
        var rx_data = '';  // Empty rx_data object
        
        var req = https.request(options, (res) => {
            console.log("Request Ok");
            console.log();
            
            res.on("data", (chunk) => {
                console.log("Data Recived");
                console.log();
                rx_data += chunk;
            });
            
            res.on("end", () => {
                console.log("\x1b[33m\x1b[1mResponse Code: ", "\x1b[0m\x1b[37m" + res.statusCode);
                console.log();
                
                if (res.statusCode < 200 || res.statusCode > 299) {
                    console.log("\x1b[31m\x1b[1m", "HTTP Error");
                    console.log();
                    console.log("\x1b[33m\x1b[1m", "RX Headers: ");
                    console.log("\x1b[0m\x1b[37m", res.headers);
                    console.log("\x1b[33m\x1b[1m", "RX Body:");
                    console.log("\x1b[0m\x1b[37m", rx_data);
                    console.log();
                    
                    console.log("\x1b[31m\x1b[1m", "Http Error Request Headers");
                    console.log("\x1b[0m\x1b[37m", req.connection._httpMessage._header);
                    console.log();
                    
                    reject({
                        message: 'HTTP Error',
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: rx_data,
                    });
                    
                    return;
                } else {
                    console.log("Successful Response");
                    // console.log(rx_data);
                    console.log();
                    if (endpoint.method == "DELETE") {
                        resolve("ok");
                    } else {
                        resolve(JSON.parse(rx_data));
                    }
                }
            });
        });
        
        if (endpoint.method == "POST") {
            console.log("\x1b[32m\x1b[1m", "Post Object:");
            console.log("\x1b[0m\x1b[37m", JSON.stringify(tx_data));
            console.log();
            req.write(JSON.stringify(tx_data));
        }
        
        console.log("\x1b[32m\x1b[1m", 'Calling API');
        console.log("\x1b[0m\x1b[37m", '');
        
        req.end();
        
        req.on("error", (err) => {
            console.log();
            console.log("Error: " + err);
            reject(err);
        });
        }
    );
};

module.exports = {
    Dimension: Dimension,
    Device: Device,
    Populators: Populators,
    SavedFilter: SavedFilter,
    User: User
};