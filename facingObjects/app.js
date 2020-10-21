const combinations = require('combinations');
const { euclidean } = require('ml-distance-euclidean');
const { dot } = require('mathjs');

const degToRad = value => value * Math.PI / 180;
const radToDeg = value => value * 180 / Math.PI;

const locations = [
    {
        deviceUuid: "9ab8e750-bc1e-11e8-a769-3f2e91eebf08",
        username: "test_user_0@yanux.org",
        position: {
            x: 1, y: 2, orientation: 30,
            place: "/app/p37.json",
        }
    },
    {
        deviceUuid: "9ab8e750-bc1e-11e8-a769-3f2e91eebf09",
        username: "test_user_0@yanux.org",
        position: {
            x: 2, y: 3, orientation: 70,
            place: "/app/p37.json",
        }
    }
]

locations.forEach(p => {
    if (p.position && (p.position.orientation !== undefined || p.position.orientation !== null)) {
        const orientationRad = degToRad(p.position.orientation);
        p.position.headingVector = [Math.cos(orientationRad), Math.sin(orientationRad)];
    }
});

const locationPairs = combinations(locations, 2, 2);
locationPairs.forEach(([l1, l2]) => {
    if (l1.position && l1.position.headingVector && l2.position.headingVector &&
        l1.position.x && l1.position.y && l2.position.x && l2.position.y) {
        const dotProduct = dot(l1.position.headingVector, l2.position.headingVector);
        const dotProductAngle = radToDeg(Math.acos(dotProduct))
        const distance = euclidean([l1.position.x, l1.position.y], [l2.position.x, l2.position.y])
        console.log(
            '-------- Computed Values for L1 (' + l1.deviceUuid + ') and L2 (' + l2.deviceUuid + ') --------',
            '\nl1.position.headingVector:', l1.position.headingVector,
            '\nl2.position.headingVector:', l2.position.headingVector,
            '\n',
            '\ndistance:', distance, 'dotProduct:', dotProduct, 'dotProductAngle:', dotProductAngle,
            '\n----------------------------------------------------------------'
        );
    }
});