db.locations.aggregate([
    {$project: {
        deviceUuid: '$deviceUuid',
        orientation: { $ifNull: [ "$position.orientation", "$proximity.orientation"] },
        updatedAt: '$updatedAt'
    }},
    {$sort:{ "updatedAt": 1 }},
    {$group: { _id : "$deviceUuid", orientation: { $last: "$orientation" } }}
])