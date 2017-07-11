# Bustabit Scripts

This repository contains scripts that can be fed into
<https://bustabit.com>'s autobetter.

If you would like to contribute or improve a script to
our repository, just submit a pull request.

TODO: Community scripts can be found in the `contrib` folder.

## Table of Contents

<!-- toc -->

- [How to use a script](#how-to-use-a-script)
- [How to write a script](#how-to-write-a-script)
  * [Bits vs Satoshis](#bits-vs-satoshis)
  * [The UI Config](#the-ui-config)
    + [Input Objects](#input-objects)
  * [Interacting with the game](#interacting-with-the-game)
    + [The Engine API](#the-engine-api)
    + [A Game object](#a-game-object)
    + [The Stores](#the-stores)

<!-- tocstop -->

## How to use a script

TODO

## How to write a script
    
### Bits vs Satoshis

**Important:** The client and server talk in satoshis even though the user interface shows bits.

- bits -> satoshis: `bits * 100` 
- bits -> bitcoins: `bits * 1e6`
- satoshis -> bits: `Math.round(satoshis / 100)`
- satoshis -> bitcoins: `satoshis * 1e8`
- bitcoins -> bits : `Math.round(bitcoins / 1e6)`
- bitcoins -> satoshis : `Math.round(bitcoins / 1e8)`

### The UI Config

At the top of every script, you must define the **UI Config**.

```javascript
var config = {
};

// Simulation begins down here ...
```

Bustabit parses the config object into a user interface
that is used to configure and drive the script.

The user uses the generated form components to feed
input into the script, and then your script can access
these values while it's running.

Here's a simple script:

```javascript
var config = {
  name: { value: '', type: 'text', label: 'What is your name?' },
  maxBet: { value: 1e8, type: 'balance', label: 'Max Bet' },
  colors: {
    value: 'red', type: 'radio', label: 'Pick a color',
    options: {
      red: { value: 'red', type: 'noop', label: 'Red' },
      blue: { value: 'blue', type: 'noop', label: 'Blue' },
    }
  }
};

log('hello', config.name.value, 'you chose the color', config.colors.value)
```

And here's the UI it generates:

![red vs blue ui example](https://dl.dropboxusercontent.com/spa/quq37nq1583x0lf/-w8ltqrk.png)

#### Input Objects

As you can see, the UI Config contains values that we will call
**Input Objects** since they get turned into form input components.

Every Input Object has a `type` which is one of:

- `text`: Maps to an `<input type="text">` field.

    ```javascript
    var config = {
      name: { value: '', type: 'text', label: 'What is your name?' },
      name2: { value: 'initial value', type: 'text', label: 'Another field' }
    }
    ```
  
    ![](https://dl.dropboxusercontent.com/spa/quq37nq1583x0lf/ok4wkz2a.png)

- `noop`: A noop input just means that it does not embed an interactive control.
  You usually use them inside a `radio` input.
  
    ```javascript
    var config = {
      noopExample: { type: 'noop', label: 'Demonstrating noop' },
      // If you don't specify a label, the key is used.
      noopExample2: { type: 'noop' }
    }
    ```

    ![](https://dl.dropboxusercontent.com/spa/quq37nq1583x0lf/zdhty8sk.png)
    
- `radio`: Maps to HTML radio buttons.

    Notice that `value: 'red'` means that `options.red` will
    be the initially-selected radio button.

    ```javascript
    var config = {
      colors: {
        value: 'red', type: 'radio', label: 'Pick a color',
        options: {
          red: { value: 'red', type: 'noop', label: 'Red' },
          blue: { value: 'blue', type: 'noop', label: 'Blue' },
        }
      }
    }
    ```
    
    ![](https://dl.dropboxusercontent.com/spa/quq37nq1583x0lf/xur6zalg.png)
- `balance`: TODO
- `multiplier`: TODO

### Interacting with the game

After the `var config = { ... }` block, the rest of the script
is run when the user clicks "Run Script."

Bustabit provides you with some variables that you can
access to interact with the game and respond to events.

#### The Engine API

The script has access to an `engine` variable which is
an Event Emitter. You attach listeners to the engine to
respond to events.

Events:

- `"GAME_STARTING"`: Emitted 5 or seconds before the game actual starts. Bets are accepted.
- `"GAME_STARTED"`: Bets are no longer accepted.
- `"GAME_ENDED"`
- `"PLACED_BET" bet`: Whenever a player places a bet, your listener will receive the `bet` object.
- `"PLAYERS_CHANGED"`: Is emitted whenever a player makes a bet or cashes out. This means that
  `engine.players` and `engine.cashOuts` have been updated, respectively.
- ...

Methods:

- `engine.bet(satoshis: Integer, payout: Float)`: 
  So, `engine.bet(100, 2)` means that you are betting 100 satoshis (1 bit) with
  an autocashout at 2x. If you don't want an autocashout, just set it really high:
  `engine.bet(100, Number.MAX_VALUE)`.
- `engine.getState()`: Serializes the state of the engine into a javascript object.
  Can be useful for debugging.

Properties:

- `engine.history`: A circular buffer of games (not a Javascript array).
    - `engine.history.first()`: the latest game. If `game.crashedAt` is not set, then it's the current game-in-progress.
    - `engine.history.last()`: the oldest game in the buffer which only stores the latest 100 games.
    - `engine.history.toArray()`: returns an `Array<Game>` so that you can use regular array methods to process the history.
- `engine.playing`: A `Map()` of usernames to their bet amount. Only includes players that have not yet cashed out.
- `engine.cashOuts`: An array of `{ wager: satoshis, uname: String, cashedAt: Float }` of all cashed out players.
    
#### A Game object

`engine.history` contains game objects with these keys:

- `game.gameId` (integer)
- `game.hash` (string)
- `game.bust` (nullable float, ex: `1.32`): 
  The multiplier that the game crashed at. 
  If it is not set, then the game is currently in progress.
- `game.cashedAt` (nullable float, ex: `103.45`):
  The multiplier that **WE** cashed-out at. 
  If it is not set, then we either did not play that game
  or the game busted before you cashed out. 
  You can check the existence of this value to determine 
  if we won that game or not.
- `game.wager` (satoshis, integer, ex: `100`)

Example:

```javascript
{
  gameId: 114124,
  hash: '92a2adb04da8231447104f9668ac1f646e1046bbdb77333f75e8bc23e871052d',
  bust: 3.21, // or null
  cashedAt: null, // or 102.34
  wager: 1000, // that's 10 bits
}
```

#### The UserInfo Store

Scripts have access to another variable, `userInfo`, which emits events and exposes info about you,
the currently logged-in user.

Useful Events:

- `BALANCE_CHANGED`: User balance changed
- `BANKROLL_STATS_CHANGED`: User's investment in the bankroll changed

Useful Properties:

- `userInfo.balance`: User balance in satoshis
- `userInfo.bets`: Total amount of user's bets
- `userInfo.wagered`: Total amount of satoshis user has wagered
- `userInfo.invested`: Total amount user has invested in the bankroll
- `userInfo.profit`
- `userInfo.unpaidDeposits`

#### The Chat Store

Scripts have access to another variable, `chat`, which emits events and exposes info about the chat,
channels, and private messages.

Useful Events:

- `FRIENDS_CHANGED`: When you have added/removed a friend.

Useful Properties:

- `chat.channels` (Map): Map of joined channels which maps channel name to `{ unread: int, history: Array<{message, uname, created}> }`
- `chat.friends` (Map): Your current friends list. Maps username to `{ unread: int, history: Array<{message, uname, created}> }`

#### Displaying Output

Your script can use `log('hello', 'world')` which will
println info to a textbox beneath the script while the
script is running.

It's useful for debugging but also providing the user with
a feed of script activity so that they know what's going on.





