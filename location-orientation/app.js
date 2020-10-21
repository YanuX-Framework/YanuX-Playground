const combinations = require('combinations');
const { euclidean } = require('ml-distance-euclidean');
const { dot, norm } = require('mathjs');

const degToRad = v => v * Math.PI / 180;
const radToDeg = v => v * 180 / Math.PI;

const locations = [
    {
        deviceUuid: "9ab8e750-bc1e-11e8-a769-3f2e91eebf08",
        username: "test_user_0@yanux.org",
        position: {
            x: 1, y: 2, orientation: 0,
            place: "/app/p37.json"
        }
    },
    {
        deviceUuid: "9ab8e750-bc1e-11e8-a769-3f2e91eebf09",
        username: "test_user_0@yanux.org",
        position: {
            x: 2, y: 3, orientation: 110,
            place: "/app/p37.json"
        }
    },
    // {
    //     deviceUuid: "9ab8e750-bc1e-11e8-a769-3f2e91eebf10",
    //     username: "test_user_0@yanux.org",
    //     position: {
    //         x: 2, y: 3, orientation: 0,
    //         place: "/app/p37.json"
    //     }
    // }
];

const headingVectorFromOrientation = orientation => [Math.cos(orientation), Math.sin(orientation)];
const computeHeadingVectors = locations => {
    locations.forEach(l => {
        if (l.position && (l.position.orientation !== undefined || l.position.orientation !== null)) {
            l.position.headingVector = headingVectorFromOrientation(degToRad(l.position.orientation));
        }
    });
    return locations;
};

const angleBetweenVectors = (v1, v2) => Math.acos(dot(v1, v2) / (norm(v1) * norm(v2)));
combinations(computeHeadingVectors(locations), 2, 2).forEach(([l1, l2]) => {
    if (l1.position && l1.position.x && l1.position.y && l2.position.x && l2.position.y &&
        l1.position.headingVector && l2.position.headingVector) {
        const distance = euclidean([l1.position.x, l1.position.y], [l2.position.x, l2.position.y])
        const dotProduct = dot(l1.position.headingVector, l2.position.headingVector);
        const angle = radToDeg(angleBetweenVectors(l1.position.headingVector, l2.position.headingVector))
        console.log(
            '-------- Computed Values for L1 (' + l1.deviceUuid + ') and L2 (' + l2.deviceUuid + ') --------',
            '\nL1 Heading Vector:', l1.position.headingVector, 'L2 Heading Vector:', l2.position.headingVector,
            '\nL1 to L2 Distance:', distance, 'L1 dot L2:', dotProduct, 'Angle Between L1 & L2:', angle,
            '\n----------------------------------------------------------------'
        );
    }
});