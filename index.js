require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const app = express();
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

bot.launch();
console.log('✅ Bot is running!');

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
