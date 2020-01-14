export default {
    components_restrictions: {
        "screen": {
            "showWhenLocalDeviceIsMissing": true, 
            "display": {
                "operator": "AND",
                "values": {
                    "virtualResolution": { "operator": ">=", "value": [1024, null] },
                    "size": { "operator": ">=", "value": [160, 90], "enforce": false }
                }
            }
        },
        "keypad": {
            "showWhenLocalDeviceIsMissing": true,
            "type": { "value": "smartphone", "enforce": false },
            "display": true,
            "input": { "operator": "OR", "values": ["mouse", "touchscreen"] }
        }
    }
}