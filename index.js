require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(require('cors')())
const bot = new Telegraf(process.env.BOT_TOKEN);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

console.log('🤖 Starting Red Bingos Bot...');

bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const username = ctx.from.username || 'Player';

  const { data } = await supabase
    .from('users')
    .select('balance')
    .eq('telegramId', telegramId)
    .single();

  if (!data) {
    await supabase.from('users').insert({
      telegramId,
      username,
      balance: 0
    });
    ctx.reply(`🎰 *Welcome to Red Bingos!* 🎰\n\nYour account created!\n\n💰 Balance: 0 ETB\n\nUse /deposit to add money.`);
  } else {
    ctx.reply(`🎰 *Welcome back, ${username}!* 🎰\n\n💰 Balance: ${data.balance} ETB`);
  }
});

bot.command('balance', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const { data } = await supabase
    .from('users')
    .select('balance')
    .eq('telegramId', telegramId)
    .single();

  if (data) {
    ctx.reply(`💰 *Your Balance:* ${data.balance} ETB`);
  } else {
    ctx.reply('❌ Please type /start first.');
  }
});

bot.command('deposit', (ctx) => {
  ctx.reply(`💵 *How to Deposit:*\n\n1. Send money to Telebirr: 0911223344\n2. Reply with the SMS text you receive.`);
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (text.toLowerCase().includes('etb') && text.toLowerCase().includes('ref')) {
    ctx.reply('✅ *Deposit Submitted!*\n\n⏳ Pending admin verification.');
  }
});
// API Routes for Mini App
app.use(express.json());

// Allow the Netlify frontend to talk to this backend
app.use(require('cors')());
app.use(express.json());

// API to get real balance from database
app.get('/api/balance', async (req, res) => {
  const telegramId = req.query.telegramId;
  if (!telegramId) return res.json({ balance: 0 });

  // Note: using 'user' because that's the table name in your screenshot
  const { data } = await supabase
    .from('user') 
    .select('balance')
    .eq('telegramId', telegramId)
    .single();

  res.json({ balance: data ? data.balance : 0 });
});

// API to buy a card (deduct money)
app.post('/api/buy-card', async (req, res) => {
  const { telegramId, amount } = req.body;
  
  // Check balance
  const { data: userData } = await supabase.from('user').select('balance').eq('telegramId', telegramId).single();
  
  if (!userData || userData.balance < amount) {
    return res.json({ success: false, message: 'Insufficient balance' });
  }

  // Deduct money
  const newBalance = userData.balance - amount;
  await supabase.from('user').update({ balance: newBalance }).eq('telegramId', telegramId);

  res.json({ success: true, newBalance: newBalance });
});
// Buy card
app.post('/api/game/buy-card', async (req, res) => {
  const { betAmount } = req.body;
  
  // For now, return success with mock data
  res.json({ 
    success: true, 
    gameId: 'demo-game-123',
    message: 'Card purchased!'
  });
});

// Get game status
app.get('/api/game/:gameId/status', async (req, res) => {
  // Return mock game state
  res.json({
    status: 'playing',
    calledNumbers: [],
    winner: null
  });
});
bot.launch();
console.log('✅ Bot is running!');

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
