db.getCollection('beaconlogs').aggregate([
      {
          $match: {
            deviceUuid: "9ab8e750-bc1e-11e8-a769-3f2e91eebf08",
            'beacon.values': ["113069EC-6E64-4BD3-6810-DE01B36E8A3E", 1, 102],
            /*updatedAt: { $gt: new Date(new Date().getTime() - 5000) },*/
            $or: [ { method: 'remove' }, { method: 'update' },  ]
          }
      },
      {
        $group: {
          deviceUuid: "$deviceUuid",
          avgRssi: { $avg: "$beacon.rssi" },
          beaconCount: { $sum: 1 },
          beacons: { $push: "$$ROOT" }
        }
      },
      { $match: { avgRssi: { $gt: -100 } } },
      { $project: { _id: 1, avgRssi: 1, avgDistance: { $literal: null }, beaconCount: 1, beacons: 1 } }
  ])