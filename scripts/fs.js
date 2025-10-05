const fs = require('fs');

function read_contract_address(name) {
    let res = {}
    try {
        const data = fs.readFileSync('contract_address.json', 'utf8');
        res = JSON.parse(data);
    } catch (err) {
        console.error(err);
    }
    return res[name];
}

function write_contract_address(name, address) {
    let res = {}
    try {
        const data = fs.readFileSync('contract_address.json', 'utf8');
        res = JSON.parse(data);
        res[name] = address
        // const jsonContent = JSON.stringify(data, null, 2); // 第二个参数是replacer，第三个参数是space，指定缩进等级
        fs.writeFileSync('contract_address.json', JSON.stringify(res, null, 2), 'utf8');
    } catch (err) {
        console.error(err);
    }
}


module.exports = {
    read_contract_address: read_contract_address,
    write_contract_address: write_contract_address
};

