var Kentik = require('./apiv5');
var https = require('https');

console.log();
console.log();
console.log('///////////////////////////////////////////////////////');
console.log();

// API Auth setup
var token = '';
var email = '';

// Setup
var dimensionName = "c_otx_threats";
var dimensionDisplayName = "OTX Threats";

// Which threat types to included
var malicious = true;
var scanning = false;
var spamming = false;

// What is the minimim threat level
var threatLevel = 4;

// Global Vars
var pops = null;
var popsL = null;
var dimension_id = null;

var syncThreats = function() {
    var dimension = new Kentik.Dimension(token, email);

    dimension.list().then(function (value) {
        console.log("Dimensions:");
        console.log(value);
        var dimensions = value.customDimensions;
        var dimFound = false;
        
        // See if Dimension exisits
        for (var d=0, dl=dimensions.length; d<dl; d++) {
            if (dimensions[d].name == dimensionName) {
                dimension.id = dimensions[d].id;
                dimension.display_name = dimensions[d].display_name;
                dimension.name = dimensions[d].name;
                dimension.populators = dimensions[d].populators;
                dimension.created_date = dimensions[d].created_date;
                dimension.updated_date = dimensions[d].updated_date;
                dimension.company_id = dimensions[d].company_id;
    
                dimFound = true;
                
                console.log();
                console.log("Dimension " + dimensionName + " Found: " + dimension.id);
                break;
            } 
        }
        
        // If not create it
        if (!dimFound) {
            console.log(dimensionName + " treat dimension not found... Creating...");
            dimension.name = dimensionName;
            dimension.type = "string";
            dimension.display_name = dimensionDisplayName;
            dimension.save().then(function (value) {
                console.log("Created Dimension");
                console.log("Checking Dimensions for ID");
                console.log();
                setTimeout(syncThreats, 500); 
                return;
            },
            function (reson) {
                console.log(reson);
                return;
            });
            return;
        }
        
        pops = dimension.populators;
        popsL = pops.length;
        dimension_id = dimension.id;
        
        console.log("Populators found: ", popsL);
        
        // Get Alien Vault List
        downloadAVList(pops, popsL, dimension.id);
        //readAVList(pops, popsL, dimension.id);
        
    }, function (reason) {
        console.log();
        console.log('Result: ');
        console.log(reason);
    });
};

var removed = 0;
var added = 0;

var downloadAVList = function (pops, popsL, dimension_id) {
    console.log();
    console.log("Getting Alien Vault List");
    var options = {
        hostname: "reputation.alienvault.com",
        port: 443,
        path: "/reputation.data",
        method: "GET",
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "User-Agent":"Mozilla/5.0 (X11; CrOS x86_64 8530.96.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.154 Safari/537.36"
        }
    };
    
    var rx_data = null;
    
    var req = https.request(options, (res) => {
        console.log("Alien Vault Request Ok");
        console.log();
        
        var rxing = false;
        
        res.on("data", (chunk) => {
            if (!rxing) {
                console.log("Downloading ...");
                console.log();
                rxing = true;
            }
            rx_data += chunk;
        });
        
        res.on("end", () => {
            console.log("\x1b[33m\x1b[1mResponse Code: ", "\x1b[0m\x1b[37m" + res.statusCode);
            console.log();
            
            if (res.statusCode < 200 || res.statusCode > 399) {
                console.log("\x1b[31m\x1b[1m", "HTTP Error");
                console.log();
                console.log("\x1b[33m\x1b[1m", "RX Headers: ");
                console.log("\x1b[0m\x1b[37m", res.headers);
                console.log("\x1b[33m\x1b[1m", "RX Body:");
                console.log("\x1b[0m\x1b[37m", rx_data);
                console.log();
                
                return;
            } else {
                console.log("Successful Response");
                prepThreatGrid(rx_data, pops, popsL, dimension_id);
            }
        });
    });
    
    req.end();
        
    req.on("error", (err) => {
            console.log();
            console.log("Error: " + err);
    });
};

// Read from flat file
var readAVList = function (pops, popsL, dimension_id) {
    console.log();
    console.log("Reading Alien Vault Threat List...");
    var fs = require('fs');
    fs.readFile('./avList.txt', 'utf8', function (err, data) {
      if (err) {
        return console.log(err);
      }
      prepThreatGrid(data, pops, popsL, dimension_id);
    });
};

var prepThreatGrid = function (rx_data, pops, popsL, dimension_id) {
    // Split Rows
    var av_rows = rx_data.split("\n");
    
    var av_malicious=[];
    var av_scanning=[];
    var av_spamming=[];
    
    console.log("Threats from AV: ", av_rows.length);
    
    // Drop empty row
    if (av_rows[av_rows.length - 1] == "") {
        av_rows.pop();
    }
    
    // Only use threat levels meets threatLevelMin
    console.log ("Filtering for minimim threat level: " + threatLevel);
    threatLevel = threatLevel - 1;
    
    for (var av=0, avl=av_rows.length; av<avl; av++) {
        // Split Columns
        var avr = av_rows[av].split("#");
        
        if (avr[2] > threatLevel) {
            if (avr[0].startsWith('null')) {
                avr[0] = avr[0].substring(4);
            }
            
            var change = null;
            if (avr[0].startsWith('+')) {
                change = "+";
                avr[0] = avr[0].substring(1);
            }
            if (avr[0].startsWith('-')) {
                change = "-";
                avr[0] = avr[0].substring(1);
            }
            
            var TYPE = avr[3].split(";");
            if (malicious && TYPE.indexOf("Malicious Host") > -1) {
                av_malicious.push({
                    "ip": avr[0]+"/32",
                    "t1": avr[1],
                    "t2": avr[2],
                    "type": "MAL",
                    "contry": avr[4],
                    "area": avr[5],
                    "loc": avr[6],
                    "occurrences": avr[7],
                    "change": change,
                    "source": "av",
                    "found": false
                });
            } else if (scanning && TYPE.indexOf("Scanning Host") > -1) {
                av_scanning.push({
                    "ip": avr[0]+"/32",
                    "t1": avr[1],
                    "t2": avr[2],
                    "type": "SCAN",
                    "contry": avr[4],
                    "area": avr[5],
                    "loc": avr[6],
                    "occurrences": avr[7],
                    "change": change,
                    "source": "av",
                    "found": false
                });
            } else if (spamming && TYPE.indexOf("Spamming") > -1) {
                av_spamming.push({
                    "ip": avr[0]+"/32",
                    "t1": avr[1],
                    "t2": avr[2],
                    "type": "SPAM",
                    "contry": avr[4],
                    "area": avr[5],
                    "loc": avr[6],
                    "occurrences": avr[7],
                    "change": change,
                    "source": "av",
                    "found": false
                });
            }
        }
    }
    
    console.log("Rows av_malicious: ", av_malicious.length);
    console.log("Rows av_scanning: ", av_scanning.length);
    console.log("Rows av_spamming: ", av_spamming.length);
    console.log();
    
    var remove = [];
    var add = [];
    var foundCount = 0;
    
    // Check for Existing Pops and any that need to be remove
    for (var p=0; p<popsL; p++) {
        var popFoundSrc = false;
        var popFoundDst = false;
        // Check Malicious
        for (var m=0, ml=av_malicious.length; m<ml; m++) {
            if (pops[p].addr == av_malicious[m].ip) {
                if (pops[p].direction == "src") {
                    popFoundSrc = true;
                } else {
                    popFoundDst = true;
                }
                if (popFoundDst && popFoundSrc) {
                    foundCount++;
                    av_malicious[m].found = true;
                    break;
                }
            }
        }
        if (popFoundDst==false && popFoundSrc==false) {
        // Check av_scanning
            for (var s=0, sl=av_scanning.length; s<sl; s++) {
                if (pops[p].addr == av_scanning[s].ip) {
                    if (pops[p].direction == "src") {
                        popFoundSrc = true;
                    } else {
                        popFoundDst = true;
                    }
                    if (popFoundDst && popFoundSrc) {
                        foundCount++;
                        av_scanning[s].found = true;
                        break;
                    }
                }
            }
        }
        if (popFoundDst==false && popFoundSrc==false) {
        // Check av_spamming
            for (var sp=0, spl=av_spamming.length; sp<spl; sp++) {
                if (pops[p].addr == av_spamming[sp].ip) {
                    if (pops[p].direction == "src") {
                        popFoundSrc = true;
                    } else {
                        popFoundDst = true;
                    }
                    if (popFoundDst && popFoundSrc) {
                        foundCount++;
                        av_spamming[sp].found = true;
                        break;
                    }
                }
            }
        }
        if (popFoundDst==false && popFoundSrc==false) {
            remove.push({
                "id": pops[p].id,
                "dimension_id": pops[p].dimension_id
            });
        }
    }
    
    console.log("Found: ", foundCount);
    
    foundCount = 0;
    
    //Check for Pops that need to be added
    for (var m=0, ml=av_malicious.length; m<ml; m++) {
        if (!av_malicious[m].found) {
            add.push(av_malicious[m]);
        }
    }
    for (var s=0, sl=av_scanning.length; s<sl; s++) {
        if (!av_scanning[s].found) {
            add.push(av_scanning[s]);
        } else {foundCount++}
    }
    for (var sp=0, spl=av_spamming.length; sp<spl; sp++) {
        if (!av_spamming[sp].found) {
            add.push(av_spamming[sp]);
        } else {foundCount++}
    }
    
    console.log("Found2: ", foundCount);
    console.log();
    console.log("Remove: ", remove.length);
    console.log("Add: ", add.length);
    
    changePops(remove, add, dimension_id);
};

var changePops = function (toRemove, toAdd, dimension_id) {
    if (toRemove.length > 0) {
        var pop = new Kentik.Populators();
        var P = toRemove.pop();
        
        console.log("Removing: ", P.id);
        
        pop.id = P.id;
        pop.dimension_id = P.dimension_id;
        
        pop.delete().then(function (value) {
            removed++;
            setTimeout(changePops, 500, toRemove, toAdd, dimension_id); 
        }, function (reason) {
            console.log();
            console.log('Result: ');
            console.log(reason);
        });
    } else if (toAdd.length > 0) {
        var pop = new Kentik.Populators();
        var P2 = toAdd.pop();
        
        console.log("Adding Src: ", P2.ip);
        
        pop.dimension_id = dimension_id;
        pop.value = "AV_"+P2.type+"_"+P2.t2;
        pop.direction = "src";
        pop.addr = P2.ip;
        
        pop.save().then(function (value) {
            console.log("Added...");
            
            pop = new Kentik.Populators();
            pop.dimension_id = dimension_id;
            pop.value = "AV_"+P2.type+"_"+P2.t2;
            pop.direction = "dst";
            pop.addr = P2.ip;
            
            added++;
            
            console.log("Adding Dst: ", P2.ip);
            
            pop.save().then(function (value) {
                console.log("Added...");
                
                added++;
                
                setTimeout(changePops, 500, toRemove, toAdd, dimension_id);
            }, function (reason) {
                console.log();
                console.log('Result: ');
                console.log(reason);
            });
        }, function (reason) {
            console.log();
            console.log('Result: ');
            console.log(reason);
        });
    } else {
        console.log("Removed: ", removed);
        console.log("added: ", added);
    }
};

syncThreats();