var config = {
  baseBet: { value: 100, type: 'balance', label: 'base bet' },
  payout: { value: 2, type: 'multiplier' },
  stop: { value: 1e8, type: 'balance', label: 'stop if bet >' },
  loss: {
    value: 'base', type: 'radio', label: 'On Loss',
    options: {
      base: { type: 'noop', label: 'Return to base bet' },
      increase: { value: 2, type: 'multiplier', label: 'Increase bet by' },
    }
  },
  win: {
    value: 'base', type: 'radio', label: 'On Win',
    options: {
      base: { type: 'noop', label: 'Return to base bet' },
      increase: { value: 2, type: 'multiplier', label: 'Increase bet by' },
    }
  }
};


log('Script is running..');

var currentBet = config.baseBet.value;

engine.on('GAME_STARTING', onGameStarted);
engine.on('GAME_ENDED', onGameEnded);

function onGameStarted() {
  engine.bet(currentBet, config.payout.value);
}

function onGameEnded() {
  var lastGame = engine.history[0];

  // If we wagered, it means we played
  if (!lastGame.wager) {
    log('strange, we missed playing in: ', lastGame);
    return;
  }

  // we won..
  if (lastGame.cashedAt) {

    if (config.win.value === 'base') {
      currentBet = config.baseBet.value;
    } else {
      console.assert(config.win.value === 'increase');
      currentBet *= config.win.options.increase.value;
    }
  } else {
    // damn, looks like we lost :(
    if (config.loss.value === 'base') {
      currentBet = config.baseBet.value;
    } else {
      console.assert(config.loss.value === 'increase');
      currentBet *= config.loss.options.increase.value;
    }
  }

  if (currentBet > config.stop.value) {
    log('Was about to bet', currentBet, 'which triggers the stop');
    engine.removeListener('GAME_STARTING', onGameStarted);
    engine.removeListener('GAME_ENDED', onGameEnded);
  }
}
