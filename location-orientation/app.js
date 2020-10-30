const _ = require('lodash');
const combinations = require('combinations');
const { euclidean } = require('ml-distance-euclidean');
const { dot, norm } = require('mathjs');

const degToRad = v => v * Math.PI / 180;
const radToDeg = v => v * 180 / Math.PI;

const locations = [
    //NOTE: Geogebra Locations Simulation #2: https://www.geogebra.org/calculator/jzn6nm8s
    {
        deviceUuid: "9ab8e750-bc1e-11e8-a769-3f2e91eebf08",
        username: "test_user_0@yanux.org",
        position: {
            x: 1, y: 1,
            orientation: 90,
            place: "bedroom"
        }
    },
    {
        deviceUuid: "9ab8e750-bc1e-11e8-a769-3f2e91eebf09",
        username: "test_user_0@yanux.org",
        position: {
            x: 2, y: 2,
            orientation: 90,
            place: "bedroom"
        }
    },
    //NOTE: Geogebra Locations Simulation #1: https://www.geogebra.org/calculator/pegje3qu
    // {
    //     deviceUuid: "9ab8e750-bc1e-11e8-a769-3f2e91eebf08",
    //     username: "test_user_0@yanux.org",
    //     position: {
    //         x: 4, y: 3,
    //         orientation: 90,
    //         place: "bedroom"
    //     }
    // },
    // {
    //     deviceUuid: "9ab8e750-bc1e-11e8-a769-3f2e91eebf09",
    //     username: "test_user_0@yanux.org",
    //     position: {
    //         //x: 4, y: 1,
    //         //x: 2, y: 3,
    //         x: 4, y: 5,
    //         //x: 7, y: 3,
    //         orientation: 225,
    //         place: "bedroom"
    //     }
    // },
    // {
    //     deviceUuid: "9ab8e750-bc1e-11e8-a769-3f2e91eebf10",
    //     username: "test_user_0@yanux.org",
    //     position: {
    //         x: 0, y: 0,
    //         orientation: 0,
    //         place: "bedroom"
    //     }
    // }
];

const headingVectorFromOrientation = orientation => [Math.cos(orientation), Math.sin(orientation)];
const computeHeadingVectors = locations => {
    locations.forEach(l => {
        if (l.position && !_.isNil(l.position.orientation)) {
            //l.position.orientation = (360 - l.position.orientation) % 360;
            l.position.headingVector = headingVectorFromOrientation(degToRad(l.position.orientation));
        }
    });
    return locations;
};

const angleBetweenVectors = (v1, v2) => Math.acos(dot(v1, v2) / (norm(v1) * norm(v2)));
combinations(computeHeadingVectors(locations), 2, 2).forEach(([l1, l2]) => {
    if (l1.position && !_.isNil(l1.position.x) && !_.isNil(l1.position.y) && !_.isNil(l2.position.x) && !_.isNil(l2.position.y) &&
        l1.position.headingVector && l2.position.headingVector) {
        const L1L2Vec = [l2.position.x - l1.position.x, l2.position.y - l1.position.y];
        const L2L1Vec = [l1.position.x - l2.position.x, l1.position.y - l2.position.y];
        const distance = euclidean([l1.position.x, l1.position.y], [l2.position.x, l2.position.y]);
        const dotProduct = dot(l1.position.headingVector, l2.position.headingVector);
        const angleBetweenHeadings = radToDeg(angleBetweenVectors(l1.position.headingVector, l2.position.headingVector));
        const orientationDiff = Math.abs(l1.position.orientation - l2.position.orientation)
        const viewAngleL1 = radToDeg(angleBetweenVectors(l1.position.headingVector, L1L2Vec))
        const viewAngleL2 = radToDeg(angleBetweenVectors(l2.position.headingVector, L2L1Vec))
        console.log(
            '-------- Computed Values for L1:', l1.deviceUuid, '& L2', l2.deviceUuid, '--------',
            '\nL1(' + l1.position.x + ', ' + l1.position.y + ')', 'L2(' + l2.position.x + ', ' + l2.position.y + ')',
            '\nOrientation L1:', l1.position.orientation, 'L2:', l2.position.orientation,
            '\nHeading Vector L1:', l1.position.headingVector, 'L2:', l2.position.headingVector,
            '\nVector L1 L2:', L1L2Vec, 'L2 L1:', L2L1Vec,
            '\nDistance L1 to L2:', distance, 'L1 dot L2:', dotProduct,
            '\nAngle Between Headings:', angleBetweenHeadings, 'Orientation Difference:', orientationDiff,
            '\nView Angle L1:', viewAngleL1, 'L2:', viewAngleL2,
            '\n----------------------------------------------------------------'
        );
    }
});