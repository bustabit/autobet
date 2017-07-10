var config = {
  target: { value: '', type: 'text', label: 'User to follow' },
  maxBet: { value: 1e8, type: 'balance', label: 'Max Bet' }
};


log('Script is running..');

engine.on('BET_PLACED', (bet) => {
  if (bet.uname == config.target.value) {

    if (userInfo.balance < 100) {
      log('You have a balance under 1 bit, you can not bet');
      return;
    }

    var wager = Math.min(userInfo.balance, bet.wager, config.maxBet.value);

    engine.bet(wager, Number.MAX_VALUE); // aim at max profit...
  }
});

engine.on('CASHED_OUT', (cashOut) => {

  if (cashOut.uname === config.target.value) {
    log('Spotted ', cashOut.uname, ' cashing out at ', cashOut.cashedAt);

    if (engine.currentlyPlaying()) {
      engine.cashOut();
    }

  }
});
