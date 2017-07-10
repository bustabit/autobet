var config = {
  bet: {
    value: 100,
    type: 'balance'
  },
  basePayout: {
    value: 2,
    type: 'multiplier',
    label: 'base payout'
  },
  stop: {
    value: 20,
    type: 'multiplier',
    label: 'stop if payout >'
  },
  loss: {
    value: 'increase',
    type: 'radio',
    label: 'On Loss',
    options: {
      base: {
        type: 'noop',
        label: 'Return to base payout'
      },
      increase: {
        value: 1,
        type: 'multiplier',
        label: 'Increase payout by +'
      },
    }
  },
  win: {
    value: 'base',
    type: 'radio',
    label: 'On Win',
    options: {
      base: {
        type: 'noop',
        label: 'Return to base payout'
      },
      increase: {
        value: 1,
        type: 'multiplier',
        label: 'Increase payout by +'
      },
    }
  }
};


log('Script is running..');

var currentPayout = config.basePayout.value;

engine.on('GAME_STARTING', onGameStarted);
engine.on('GAME_ENDED', onGameEnded);

function onGameStarted() {
  log('betting', config.bet.value, 'at payout of', currentPayout, 'x')
  engine.bet(config.bet.value, currentPayout);
}

function onGameEnded(info) {
  var lastGame = engine.history.first()

  // If we wagered, it means we played
  if (!lastGame.wager) {
    log('strange, we missed playing in: ', lastGame);
    return;
  }

  // we won..
  if (lastGame.cashedAt) {
    if (config.win.value === 'base') {
      currentPayout = config.basePayout.value;
      log('won, so resetting payout to', currentPayout)
    } else {
      console.assert(config.win.value === 'increase');
      currentPayout += config.win.options.increase.value;
      log('won, so increasing payout to', currentPayout)
    }
  } else {
    // damn, looks like we lost :(
    if (config.loss.value === 'base') {
      currentPayout = config.basePayout.value;
      log('lost, so resetting payout to', currentPayout)
    } else {
      console.assert(config.loss.value === 'increase');
      currentPayout += config.loss.options.increase.value;
      log('lost, so increasing payout', currentPayout)
    }
  }

  if (currentPayout > config.stop.value) {
    log('Was about to bet with payout', currentPayout, 'which triggers the stop');
    engine.removeListener('GAME_STARTING', onGameStarted);
    engine.removeListener('GAME_ENDED', onGameEnded);
  }
}
