// JavaScript numeric experiments with synthetic inputs. No network or app code.
const ticks = ['0.1', '0.01', '0.005', '0.0025', '0.001', '0.0001'];
const result = {
  environment: { node: process.version, platform: process.platform, architecture: process.arch },
  inputConversions: ['', ' ', null, undefined, '0', '0.000', '0.50', '0.500', '0.5oops', 'NaN', 'Infinity'].map((input) => ({
    input: input === undefined ? { type: 'undefined' } : input,
    number: String(Number(input)),
    finite: Number.isFinite(Number(input)),
  })),
  spreads: [['0.51', '0.50'], ['0.52', '0.51'], ['0.5025', '0.5000'], ['0.50', '0.50'], ['0.49', '0.50']].map(([ask, bid]) => ({
    ask, bid,
    subtraction: String(Number(ask) - Number(bid)),
    fixedFour: (Number(ask) - Number(bid)).toFixed(4),
  })),
  tickDecimalPlaces: ticks.map((tick) => ({
    tick,
    decimalPlaces: tick.split('.')[1].length,
    negativeLogTen: -Math.log10(Number(tick)),
  })),
  formattingIsNotGridRounding: {
    price: '0.503', tick: '0.005', fixedThree: Number('0.503').toFixed(3),
    exactScaledPrice: 503, exactScaledTick: 5, integerRemainder: 503 % 5,
  },
  equalWidthsWithDifferentFloatingResults: {
    first: String(0.51 - 0.50), second: String(0.52 - 0.51),
    equal: Object.is(0.51 - 0.50, 0.52 - 0.51),
    anotherFirst: String(0.30 - 0.29), anotherSecond: String(0.31 - 0.30),
    anotherEqual: Object.is(0.30 - 0.29, 0.31 - 0.30),
  },
  limitations: ['Synthetic language experiments, not exchange observations.', 'No flash implementation, browser timing test, or rounding library was tested.'],
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
