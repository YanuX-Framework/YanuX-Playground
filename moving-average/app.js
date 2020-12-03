
const period = 3;
const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 15, 15, 15];
const fillValues = Array(period - 1).fill(values[0]);

function technicalIndicators() {
    const { SMA } = require('technicalindicators');
    const ma = new SMA({ period: period, values: [] });

    fillValues.forEach(fillValue => {
        const fillResult = ma.nextValue(fillValue);
        console.log('Fill Value:', fillResult);
    });

    values.forEach(value => {
        console.log('Next Value:', ma.nextValue(value));
    });
}

function tradingSignals() {
    const { SMA } = require('trading-signals');
    const ma = new SMA(period);

    fillValues.forEach(fillValue => {
        ma.update(fillValue);
        // try {
        //     const fillResult = ma.getResult().toNumber();
        //     console.log('Fill Value:', fillResult);
        // } catch (e) { console.error('Fill Value Error:', e.message); }
    });

    values.forEach(value => {
        ma.update(value);
        try { console.log('Next Value:', ma.getResult().toNumber()); }
        catch (e) { console.error('Next Value Error:', e.message); }
    });
}

//technicalIndicators()
tradingSignals();