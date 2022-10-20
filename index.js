const mineflayer = require('mineflayer'); // importar el modulo mineflayer
const { mineflayer: mineflayerViewer } = require('prismarine-viewer'); // importar el modulo mineflayerViewer
 
//const pathfinder = require('mineflayer-pathfinder').pathfinder; NO ACTIVAR
//const Movements = require('mineflayer-pathfinder').Movements; NO ACTIVAR
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder') // importar el modulo mineflayer-pathfinder
const { GoalNear, GoalNearXZ } = require('mineflayer-pathfinder').goals; // importar el modulo mineflayer-pathfinder
const pvp = require('mineflayer-pvp').plugin // importar el modulo mineflayer-pvp
const armorManager = require('mineflayer-armor-manager')  // importar el modulo mineflayer-armor-manager
const mc = require('minecraft-protocol');   // importar el modulo minecraft-protocol
//const AutoAuth = require('mineflayer-auto-auth');
const prefix = '!'; // prefijo del comando
const bot = mineflayer.createBot({ // crear el bot
    host: 'ACA VA TU IP', // minecraft server ip
    username: 'NOMBRE DEL BOT', // minecraft username
    //password: '8520456' // minecraft password, comment out if you want to log into online-mode=false servers
    port: 25565,                // Puerto de tu server
    version: "1.12.2",             // Recomiendo Dejarlo en 1.12.2 o 1.15.2.1.16.5 estas verciones funcionan bien
    // auth: 'mojang'              // NO ACTIVAR
});
////////////////////////////////////BY OdahViing/////////////////////////////////////////////
bot.loadPlugin(pathfinder);
bot.loadPlugin(pvp)
bot.loadPlugin(armorManager)
let mcData
bot.once('inject_allowed', () => {
  mcData = require('minecraft-data')(bot.version)
})
bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return
  setTimeout(() => {
    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
    if (sword) bot.equip(sword, 'hand')
  }, 150)
})
bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return
  setTimeout(() => {
    const shield = bot.inventory.items().find(item => item.name.includes('shield'))
    if (shield) bot.equip(shield, 'off-hand')
  }, 250)
})
let guardPos = null
function guardArea (pos) {
  guardPos = pos
  if (!bot.pvp.target) {
    moveToGuardPos()
  }
}
function stopGuarding () {
  guardPos = null
  bot.pvp.stop()
  bot.pathfinder.setGoal(null)
}
function moveToGuardPos () {
  const mcData = require('minecraft-data')(bot.version)
  bot.pathfinder.setMovements(new Movements(bot, mcData))
  bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}
bot.on('stoppedAttacking', () => {
  if (guardPos) {
    moveToGuardPos()
  }
})
bot.on('physicTick', () => {
  if (bot.pvp.target) return
  if (bot.pathfinder.isMoving()) return
  const entity = bot.nearestEntity()
  if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))
})
bot.on('physicTick', () => {
  if (!guardPos) return
  const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 &&
  e.mobType !== 'Armor Stand' 
  const entity = bot.nearestEntity(filter)
  if (entity) {
    bot.pvp.attack(entity)
  }
})
bot.once('spawn', () => {
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    defaultMove.allow1by1towers = true;
    defaultMove.canDig = true;
    defaultMove.allowParkour = true;
    defaultMove.allowSprinting = true;
    defaultMove.scafoldingBlocks = [];
    defaultMove.scafoldingBlocks.push(mcData.itemsByName['dirt'].id);
    bot.pathfinder.setMovements(defaultMove);
    mineflayerViewer(bot, { port: 3007, firstPerson: true })
});
bot.on('chat', (username, message) => {
    if(username == bot.username) return;
    
    if(!message.startsWith(prefix)) {
        return;
    }
    const args = message.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
	if(command == 'di') {
        bot.chat(args.join(' '));
    }
	if(command == 'ven') {
        const target = bot.players[username] ? bot.players[username].entity : null;
        if(!target) {
            bot.chat('No te puedo ver, no se donde estas, prueba de entrar detro de mis chunks o acercarte mas a mi');
            return;
        }
        const player = target.position;
        bot.pathfinder.setGoal(new GoalNear(player.x, player.y, player.z, 1));
    }
	if(command == 'goto') {
        const x = parseInt(args[0]);
        const y = parseInt(args[1]);
        const z = parseInt(args[2]);
        bot.pathfinder.setGoal(new GoalNear(x, y, z, 1));
    }
	if(command == 'xz') {
        const x = parseInt(args[0]);
        const z = parseInt(args[1]);
        bot.pathfinder.setGoal(new GoalNearXZ(x, z, 1));
    }
});
bot.on('stoppedAttacking', () => {
  if (guardPos) {
    moveToGuardPos()
  }
})
bot.on('physicsTick', () => {
  if (!guardPos) return // Do nothing if bot is not guarding anything
  const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 &&
  e.mobType !== 'Armor Stand' // Mojang classifies armor stands as mobs for some reason?
  const entity = bot.nearestEntity(filter)
  if (entity) {
    bot.pvp.attack(entity)
  }
})
bot.on('chat', (username, message) => {
  // Guard the location the player is standing
  if (message === 'guard') {
    const player = bot.players[username]
    if (!player) {
      bot.chat("No te puedo ver, no se donde estas, prueba de entrar detro de mis chunks o acercarte mas a mi.")
      return
    }
    bot.chat('Cuidare Esta Zona Con Mi Vida.')
    guardArea(player.entity.position)
  }
  if (message === 'stop') {
    bot.chat('Ok Me Pongo En Modo Descanso.')
    stopGuarding()
  }
})
// Muestra los errores en la consola o motivos de expulsacion
bot.on('kicked', console.log);
bot.on('error', console.log);
