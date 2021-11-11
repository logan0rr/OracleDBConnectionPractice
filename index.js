const request = require('request-promise');
const oracle = require('oracledb');
oracle.outFormat = oracle.OBJECT;
oracle.autoCommit = true;

const params = {
    user: process.env.user,
    password: process.env.password,
    connectString: 'ora7gdev.byu.edu:1521/cescpy1.byu.edu'
}

async function testOracleConnectivity(){
    try{
        console.log('Testing connection to on-prem OracleDb');
        const conn = await oracle.getConnection(params);
        const result = await conn.execute('select * from DUAL');
        console.log(result.rows);
        await conn.close();
        console.log('Successfully connected to on-prem OracleDB');
    }catch(error){
        console.log("unable to create a connection to on-prem OracleDB");
        throw error;
    }
}

let options = {
    url: 'https://api.byu.edu:443/byuapi/persons/v3/234889876',
    method: 'GET',
    headers: {
        // TODO: ADD IN A BEARER TOKEN
        'Authorization': 'Bearer c13eb6869e71afc782f3698746ddc435'
    }
}

let byu_id, name, phoneNumber, address

request.get(options)
    .then((body) => {
        const person = JSON.parse(body);
        byu_id = person.basic.byu_id.value;
        name = person.basic.name_fnf.value;
        console.log(byu_id);
        console.log(name);
        options.url = 'https://api.byu.edu:443/byuapi/persons/v3/234889876/phones'
        return request.get(options);
    }).then((body) => {
        const phones = JSON.parse(body);
        phoneNumber = phones.values[0].lookup_number.value;
        console.log(phoneNumber);
        options.url = 'https://api.byu.edu:443/byuapi/persons/v3/234889876/addresses';
        return request.get(options);
    }).then( (body) => {
        const addresses = JSON.parse(body);
        address = addresses.values[0].address_line_1.value + " " + addresses.values[0].address_line_2.value;
        console.log(address);
    }).then( () => {
        addToTable(byu_id, name, phoneNumber, address);
})

async function addToTable (byu_id, name, phoneNumber, address) {
    try{
        console.log('Adds something to the table');
        const conn = await oracle.getConnection(params);
        await conn.execute('INSERT INTO OIT#LORR2.MY_TABLE (BYU_ID, FULL_NAME, PHONE_NUMBER, ADDRESS)' +
            'VALUES (: byuId, :name, :phoneNumber, :address)', [byu_id, name, phoneNumber, address]);
        await conn.close();
        console.log('Successfully added table to on-prem OracleDB');
    }catch(error){
        console.error('Unable to create new item on on-prem OracleDB');
        throw error;
    }
}

//
// testOracleConnectivity();