// ---- bonjour ----
// const bonjour = require('bonjour')()
// // advertise an HTTP server on port 3000
// bonjour.publish({ name: 'YanuX-Broker', type: 'http', port: 3002 })
// // browse for all http services
// bonjour.find({ type: 'http' }, function (service) {
//     console.log('Found an HTTP server:', service)
// })

// ---- dnssd ----
// const dnssd = require('dnssd');
// // advertise a http server on port 4321
// const ad = new dnssd.Advertisement(dnssd.tcp('http'), 4321, { name: "DNSSD"});
// ad.start();
// const browser = dnssd.Browser(dnssd.all())
//   .on('serviceUp', service => console.log("Device up: ", service))
//   .on('serviceDown', service => console.log("Device down: ", service))
//   .start();