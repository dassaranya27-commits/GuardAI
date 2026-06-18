// ==================== GUARDAI - SIMPLE WORKING VERSION ====================

let app = {
    seconds: 300,
    isRunning: false,
    interval: null,
    logs: JSON.parse(localStorage.getItem('guard_logs')) || [],
    ignoreCount: 0,
    fatigueEventsToday: 0,
    isAlertActive: false,
    fatigueLevel: 0
};

function playBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.15;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
}

// ==================== UPDATE AVATAR ====================

function updateAvatar() {
    const avatarEmoji = document.getElementById('avatarEmoji');
    const avatarStatus = document.getElementById('avatarStatus');
    const avatarEnergyBar = document.getElementById('avatarEnergyBar');
    const energyPercent = Math.max(0, 100 - app.fatigueLevel);
    
    avatarEnergyBar.style.width = energyPercent + '%';
    
    if (energyPercent > 70) {
        avatarEnergyBar.style.background = "linear-gradient(90deg, #88ff88, #aaffaa)";
    } else if (energyPercent > 40) {
        avatarEnergyBar.style.background = "linear-gradient(90deg, #ffaa44, #ffcc66)";
    } else {
        avatarEnergyBar.style.background = "linear-gradient(90deg, #ff4444, #ff6666)";
    }
    
    if (!app.isRunning) {
        avatarEmoji.innerHTML = "😴";
        avatarStatus.innerHTML = "Click 'Start Session' to begin";
        return;
    }
    
    if (app.isAlertActive) {
        avatarEmoji.innerHTML = "⚠️😵⚠️";
        avatarStatus.innerHTML = "FATIGUE ALERT! Take a break!";
        return;
    }
    
    if (app.fatigueLevel < 20) {
        avatarEmoji.innerHTML = "🧑‍💻⚡";
        avatarStatus.innerHTML = "Peak Performance! Energy: " + Math.round(energyPercent) + "%";
    } else if (app.fatigueLevel < 50) {
        avatarEmoji.innerHTML = "😐💻";
        avatarStatus.innerHTML = "Focusing... Energy: " + Math.round(energyPercent) + "%";
    } else if (app.fatigueLevel < 80) {
        avatarEmoji.innerHTML = "😫📚";
        avatarStatus.innerHTML = "Getting tired... Take a break soon! Energy: " + Math.round(energyPercent) + "%";
    } else {
        avatarEmoji.innerHTML = "😴💀";
        avatarStatus.innerHTML = "Critical Fatigue! Break NOW! Energy: " + Math.round(energyPercent) + "%";
    }
}

// ==================== SIMULATE FATIGUE ====================

function simulateFatigue() {
    if (!app.isRunning) {
        alert("Please start a study session first (click 'Start Session')");
        return;
    }
    if (app.isAlertActive) {
        alert("Alert already active - please respond to it first");
        return;
    }
    
    app.fatigueLevel = Math.min(100, app.fatigueLevel + 20);
    updateAvatar();
    
    document.getElementById('ai-status-tag').innerHTML = `🧠 AI: Fatigue detected (+20%) | Current: ${Math.round(app.fatigueLevel)}%`;
    
    if (app.fatigueLevel >= 75) {
        triggerFatigueAlert();
    }
    
    setTimeout(() => {
        if (!app.isAlertActive) {
            document.getElementById('ai-status-tag').innerHTML = "🧠 AI: Monitoring fatigue...";
        }
    }, 2000);
}

function resetFatigue() {
    if (app.isAlertActive) {
        alert("Please respond to the alert first");
        return;
    }
    app.fatigueLevel = 0;
    updateAvatar();
    document.getElementById('ai-status-tag').innerHTML = "🔄 Fatigue reset to 0%";
    setTimeout(() => {
        document.getElementById('ai-status-tag').innerHTML = "🧠 AI: Monitoring fatigue...";
    }, 1500);
}

// ==================== FATIGUE ALERT ====================

function triggerFatigueAlert() {
    if (app.isAlertActive) return;
    app.isAlertActive = true;
    
    playBeep();
    playBeep();
    
    app.fatigueEventsToday++;
    const fatigueElem = document.getElementById('fatigueCount');
    if (fatigueElem) fatigueElem.innerHTML = app.fatigueEventsToday;
    
    app.logs.push({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        risk: Math.min(95, 65 + Math.floor(app.fatigueLevel / 2))
    });
    if (app.logs.length > 10) app.logs.shift();
    localStorage.setItem('guard_logs', JSON.stringify(app.logs));
    
    if (document.getElementById('page-wellness').classList.contains('active')) {
        initChart();
    }
    
    if (app.isRunning) {
        clearInterval(app.interval);
        app.isRunning = false;
        document.getElementById('timerBtn').innerText = "RESUME SESSION";
    }
    
    document.getElementById('camContainer').style.borderColor = "#ff4d4d";
    document.getElementById('intervention-hub').className = "intervention-visible";
    document.getElementById('alert-title').innerHTML = "⚠️ FATIGUE DETECTED!";
    document.getElementById('alert-desc').innerHTML = "AI has detected signs of fatigue. Time for a wellness break!";
    
    updateAvatar();
}

// ==================== TIMER FUNCTIONS ====================

function updateDisplay() {
    const mins = Math.floor(app.seconds / 60);
    const secs = app.seconds % 60;
    document.getElementById('timeDisplay').innerHTML = `${mins}:${secs.toString().padStart(2, '0')}`;
}

function toggleTimer() {
    const btn = document.getElementById('timerBtn');
    const setupArea = document.getElementById('setupArea');
    
    if (!app.isRunning) {
        if (setupArea.style.display !== "none") {
            let minutesInput = document.getElementById('minutesInput').value;
            if (minutesInput && parseInt(minutesInput) > 0) {
                app.seconds = parseInt(minutesInput) * 60;
                setupArea.style.display = "none";
                updateDisplay();
            } else {
                alert("Please enter minutes");
                return;
            }
        }
        
        app.isRunning = true;
        app.fatigueLevel = 0;
        updateAvatar();
        
        app.interval = setInterval(() => {
            if (app.seconds <= 0) {
                clearInterval(app.interval);
                app.isRunning = false;
                document.getElementById('timerBtn').innerText = "START SESSION";
                playBeep();
                playBeep();
                alert("🎉 Session Complete! Great focus!");
                updateAvatar();
            } else {
                app.seconds--;
                updateDisplay();
            }
        }, 1000);
        
        btn.innerText = "PAUSE";
        document.getElementById('ai-status-tag').innerHTML = "🧠 AI: Monitoring fatigue...";
        
    } else {
        clearInterval(app.interval);
        app.isRunning = false;
        btn.innerText = "RESUME";
        updateAvatar();
    }
}

function resetTimer() {
    clearInterval(app.interval);
    app.isRunning = false;
    app.ignoreCount = 0;
    app.isAlertActive = false;
    app.fatigueLevel = 0;
    app.seconds = parseInt(document.getElementById('minutesInput').value) * 60 || 300;
    
    document.getElementById('timerBtn').innerText = "START SESSION";
    document.getElementById('setupArea').style.display = "flex";
    document.getElementById('timeDisplay').innerHTML = "05:00";
    document.getElementById('intervention-hub').className = "intervention-hidden";
    document.getElementById('mainAlertCard').classList.remove('critical');
    document.getElementById('ignoreBtn').style.display = "block";
    document.getElementById('warning-text').style.display = "none";
    document.getElementById('critical-warning').style.display = "none";
    document.getElementById('camContainer').style.borderColor = "var(--pink)";
    
    updateDisplay();
    updateAvatar();
}

function previewTime() {
    if (!app.isRunning) {
        const val = document.getElementById('minutesInput').value;
        if (val && parseInt(val) > 0) {
            const tempSeconds = parseInt(val) * 60;
            const mins = Math.floor(tempSeconds / 60);
            const secs = tempSeconds % 60;
            document.getElementById('timeDisplay').innerHTML = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }
}

// ==================== INTERVENTION HANDLERS ====================

function dismissAlert(resumeTimer = true) {
    app.isAlertActive = false;
    document.getElementById('intervention-hub').className = "intervention-hidden";
    document.getElementById('camContainer').style.borderColor = "var(--pink)";
    document.getElementById('warning-text').style.display = "none";
    document.getElementById('critical-warning').style.display = "none";
    document.getElementById('mainAlertCard').classList.remove('critical');
    
    if (resumeTimer && app.seconds > 0) {
        app.isRunning = true;
        app.interval = setInterval(() => {
            if (app.seconds <= 0) {
                clearInterval(app.interval);
                app.isRunning = false;
                document.getElementById('timerBtn').innerText = "START SESSION";
                playBeep();
                playBeep();
                alert("🎉 Session Complete!");
                updateAvatar();
            } else {
                app.seconds--;
                updateDisplay();
            }
        }, 1000);
        document.getElementById('timerBtn').innerText = "PAUSE";
    }
    
    updateAvatar();
}

function handleIgnore() {
    app.ignoreCount++;
    
    if (app.ignoreCount === 1) {
        document.getElementById('warning-text').style.display = "block";
        playBeep();
        dismissAlert(true);
    } else if (app.ignoreCount === 2) {
        document.getElementById('warning-text').style.display = "none";
        document.getElementById('critical-warning').style.display = "block";
        playBeep();
        playBeep();
    } else if (app.ignoreCount >= 3) {
        lockdown();
    }
}

function lockdown() {
    playBeep();
    playBeep();
    playBeep();
    document.getElementById('mainAlertCard').classList.add('critical');
    document.getElementById('alert-title').innerText = "🔒 SYSTEM LOCKDOWN";
    document.getElementById('alert-desc').innerText = "Critical fatigue threshold exceeded.";
    document.getElementById('ignoreBtn').style.display = "none";
    document.getElementById('critical-warning').innerHTML = "💀 LOCKDOWN - Click RESET 💀";
    
    if (app.isRunning) {
        clearInterval(app.interval);
        app.isRunning = false;
    }
    app.isAlertActive = false;
    updateAvatar();
}

function executeOption(type) {
    let message = "";
    switch(type) {
        case 'nap': 
            message = "😴 Power Nap scheduled! Avatar recovers 80% energy."; 
            app.fatigueLevel = Math.max(0, app.fatigueLevel - 80);
            break;
        case 'breath': 
            message = "🌬️ Box Breathing: Inhale 4 → Hold 4 → Exhale 4 → Hold 4 (4x)"; 
            app.fatigueLevel = Math.max(0, app.fatigueLevel - 40);
            break;
        case 'walk': 
            message = "🚶 Movement break: Stand and stretch for 5 minutes!"; 
            app.fatigueLevel = Math.max(0, app.fatigueLevel - 50);
            break;
    }
    alert("✅ " + message);
    
    updateAvatar();
    
    app.ignoreCount = 0;
    document.getElementById('ignoreBtn').style.display = "block";
    document.getElementById('warning-text').style.display = "none";
    document.getElementById('critical-warning').style.display = "none";
    document.getElementById('mainAlertCard').classList.remove('critical');
    
    dismissAlert(true);
}

// ==================== WELLNESS DASHBOARD ====================

function syncData() {
    const sleepHours = parseFloat(document.getElementById('sleepInput').value);
    const moodValue = parseInt(document.getElementById('moodInput').value);
    
    if (isNaN(sleepHours)) {
        alert("Please enter your sleep hours");
        return;
    }
    
    let risk = Math.max(5, Math.min(95, 
        (8 - Math.min(8, sleepHours)) * 12 + 
        (5 - moodValue) * 8
    ));
    
    risk = Math.min(95, risk + Math.floor(app.fatigueEventsToday * 3));
    
    app.logs.push({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        risk: risk
    });
    if (app.logs.length > 10) app.logs.shift();
    localStorage.setItem('guard_logs', JSON.stringify(app.logs));
    
    document.getElementById('riskScore').innerHTML = Math.round(risk) + "%";
    document.getElementById('riskBar').style.width = risk + "%";
    
    updateHealthTips(risk);
    initChart();
}

function updateHealthTips(risk) {
    const tipText = document.getElementById('ai-tip-text');
    if (risk < 25) {
        tipText.innerHTML = "🌟 Avatar is happy! Peak focus! Keep going!";
    } else if (risk < 50) {
        tipText.innerHTML = "💪 Avatar is focused. Take short breaks every 45 min.";
    } else if (risk < 75) {
        tipText.innerHTML = "⚠️ Avatar looks tired. Try 2 minutes of deep breathing.";
    } else {
        tipText.innerHTML = "🚨 Avatar exhausted! Take a 15-minute power nap!";
    }
}

let chart;
function initChart() {
    const ctx = document.getElementById('wellnessChart').getContext('2d');
    if (chart) chart.destroy();
    
    const labels = app.logs.slice(-10).map(l => l.time);
    const data = app.logs.slice(-10).map(l => l.risk);
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
                label: 'Burnout Risk %',
                data: data.length ? data : [0],
                borderColor: '#ff6a88',
                backgroundColor: 'rgba(255, 106, 136, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ff9a8b',
                pointBorderColor: '#fff',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: '#fff' } }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.1)' }, min: 0, max: 100 },
                x: { ticks: { color: '#fff' } }
            }
        }
    });
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('btn-' + id).classList.add('active');
    
    if (id === 'wellness') {
        document.getElementById('fatigueCount').innerHTML = app.fatigueEventsToday;
        initChart();
    }
}

// ==================== INITIALIZATION ====================

window.addEventListener('load', function() {
    console.log("🚀 GuardAI Started!");
    
    document.getElementById('minutesInput').value = "5";
    app.seconds = 300;
    updateDisplay();
    
    if (app.logs.length > 0) {
        const lastLog = app.logs[app.logs.length - 1];
        document.getElementById('riskScore').innerHTML = Math.round(lastLog.risk) + "%";
        document.getElementById('riskBar').style.width = lastLog.risk + "%";
        updateHealthTips(lastLog.risk);
    }
    
    updateAvatar();
    document.getElementById('ai-status-tag').innerHTML = "🧠 AI: Monitoring fatigue...";
});