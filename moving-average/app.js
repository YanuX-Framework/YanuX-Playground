
const period = 10;
const values = [2, 2, 0.5, 2, 2, 2.5, 3, 4, 2, 2.25, 1.5, 2, 3, 3.5, 4, 4, 4.5, 3.5, 4];
const fillValues = Array(period - 1).fill(values[0]);

function technicalIndicators() {
    console.log('[ -- Technical Indicators -- ]')
    const { SMA: MovingAverage } = require('technicalindicators');
    const ma = new MovingAverage({ period: period, values: [] });

    fillValues.forEach(fillValue => {
        const fillResult = ma.nextValue(fillValue);
        //console.log('Fill Value:', fillResult);
    });

    values.forEach(value => {
        console.log('Next Value:', ma.nextValue(value));
    });
}

function tradingSignals() {
    console.log('[ -- Tading Signals -- ]')
    const { SMA: MovingAverage } = require('trading-signals');
    const ma = new MovingAverage(period);

    fillValues.forEach(fillValue => { ma.update(fillValue); });
    values.forEach(value => {
        ma.update(value);
        try { console.log('Next Value:', ma.getResult().toNumber()); }
        catch (e) { console.error('Next Value Error:', e.message); }
    });
}

//technicalIndicators()
tradingSignals();