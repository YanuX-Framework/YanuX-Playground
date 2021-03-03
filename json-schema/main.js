const fs = require('fs');
const Ajv = require("ajv").default;

const ajv = new Ajv();
const schema = require('./components-restriction-language/components-restriction-schema.json')
let docs = [
    require('./components-restriction-language/components-restriction-example1.json'),
    require('./components-restriction-language/components-restriction-example2.json'),
    require('./components-restriction-language/components-restriction-example3.json')
];

const validate = ajv.compile(schema)
docs.forEach((d, i) => {
    const valid = validate(d)
    if (!valid) {
        console.log("Document "+i+" is invalid:")
        console.log(validate.errors)
    } else {
        console.log("Document "+i+" is valid.")
    }
})
