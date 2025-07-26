document.addEventListener('DOMContentLoaded', () => {
    console.log("【スクリプト開始】");

    // HTML要素の取得
    const openingScreen = document.getElementById('opening-screen');
    const shachoNameInput = document.getElementById('shacho-name-input');
    const startGameButton = document.getElementById('start-game-button');
    const appScreen = document.getElementById('app');
    const shachoNameElement = document.getElementById('shacho-name');
    const rankElement = document.getElementById('rank');
    const xpBar = document.getElementById('xp-bar');
    const xpText = document.getElementById('xp-text');
    const employeeCountElement = document.getElementById('employee-count');
    const office = document.getElementById('office');
    const employeeContainer = document.getElementById('employee-container');
    const startPomodoroButton = document.getElementById('start-pomodoro');
    const startBreakButton = document.getElementById('start-break');
    const timerElement = document.getElementById('timer');
    const timerScreen = document.getElementById('timer-screen');
    const collectionButton = document.getElementById('collection-button');
    const achievementsButton = document.getElementById('achievements-button');
    const collectionScreen = document.getElementById('collection-screen');
    const achievementsScreen = document.getElementById('achievements-screen');
    const closeCollectionButton = document.getElementById('close-collection');
    const closeAchievementsButton = document.getElementById('close-achievements');
    const settingsButton = document.getElementById('settings-button');
    const settingsScreen = document.getElementById('settings-screen');
    const closeSettingsButton = document.getElementById('close-settings');
    const resetGameButton = document.getElementById('reset-game-button');
    const helpButton = document.getElementById('help-button');
    const helpScreen = document.getElementById('help-screen');
    const closeHelpButton = document.getElementById('close-help');
    const rankUpScreen = document.getElementById('rank-up-screen');
    const newRankDisplay = document.getElementById('new-rank-display');
    const closeRankUpButton = document.getElementById('close-rank-up');

    // ゲームの状態を管理するオブジェクト (初期値)
    const initialGameState = {
        shachoName: '',
        rank: '平社員',
        xp: 0,
        xpToNextLevel: 10,
        employees: 0,
        pomodorosCompleted: 0,
        totalFocusTime: 0,
        achievements: [],
        employeeCollection: [],
        // タイマーの状態を追加
        timerRunning: false,
        timerEndTime: 0,
        isPomodoro: true, // ポモドーロ中か休憩中か (true: ポモドーロ, false: 休憩)
    };
    let gameState = { ...initialGameState }; // 初期状態をコピー

    // マスターデータ
    const ranks = ['平社員', '主任', '係長', '課長', '次長', '部長', '本部長', '常務', '専務', '副社長', '社長', '会長', '神'];
    const employeeTypes = [{ type: '新人', color: '#ffadad' }, { type: '中堅', color: '#ffd6a5' }, { type: 'ベテラン', color: '#caffbf' }];
    const randomNames = [
        '田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '中村', '小林', '加藤', '吉田',
        '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水', '山崎',
        '森', '池田', '橋本', '阿部', '石川', '前田', '藤田', '後藤', '小野', '村上',
        '近藤', '坂本', '遠藤', '青木', '福田', '西村', '太田', '藤原', '原田', '中島',
    ];
    const achievements = [{ id: 'first_pomodoro', name: '初めの第一歩', description: '初めてのポモドーロを完了した。' }, { id: 'ten_pomodoros', name: '集中力の達人', description: '10回のポモドーロを完了した。' }, { id: 'rank_up', name: '昇進おめでとう！', description: '初めて昇進した。' }];
    let timerInterval; // setIntervalのIDを保持
    let autoSaveInterval;

    // --- 初期化処理 ---
    function init() {
        console.log("【init】初期化処理を開始します。");
        requestNotificationPermission(); // 通知の許可をリクエスト
        const savedState = localStorage.getItem('pomoShachoState');
        if (savedState) {
            console.log("【init】localStorageに保存されたデータが見つかりました。");
            gameState = JSON.parse(savedState);
            // 名前が保存されていれば、メイン画面を直接表示
            if (gameState.shachoName) {
                console.log("【init】社長名が設定されているため、メイン画面を表示します。");
                showMainApp();
                updateUI();
                startAutoSave(); // オートセーブを開始

                // 保存されたタイマーが実行中であれば再開
                if (gameState.timerRunning && gameState.timerEndTime > Date.now()) {
                    console.log("【init】実行中のタイマーを再開します。残り時間: ", Math.ceil((gameState.timerEndTime - Date.now()) / 1000), "秒");
                    startTimer(Math.ceil((gameState.timerEndTime - Date.now()) / 1000)); // 残り時間でタイマーを再開
                } else if (gameState.timerRunning && gameState.timerEndTime <= Date.now()) {
                    // タイマーがバックグラウンドで終了していた場合
                    console.log("【init】タイマーがバックグラウンドで終了していました。完了処理を実行します。");
                    completeTimer(); // タイマー終了処理を直接呼び出す
                }
                return;
            }
        }
        console.log("【init】社長名が設定されていない、またはデータがないため、オープニング画面を表示します。");
        // 保存された名前がなければ、オープニング画面を表示
        showOpeningScreen();
    }

    function requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn("このブラウザは通知をサポートしていません。");
            return;
        }
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("通知の許可が得られました。");
            } else if (permission === "denied") {
                console.warn("通知が拒否されました。");
            } else {
                console.log("通知の許可が保留されています。");
            }
        });
    }

    function showOpeningScreen() {
        console.log("【showOpeningScreen】オープニング画面を表示します。");
        openingScreen.style.display = 'flex'; // flexに変更
        appScreen.style.display = 'none';
    }

    function showMainApp() {
        console.log("【showMainApp】メインアプリ画面を表示します。");
        openingScreen.style.display = 'none';
        appScreen.style.display = 'flex'; // flexに変更
    }

    // --- 主要な関数 ---
    function updateUI() {
        shachoNameElement.textContent = `${gameState.shachoName}${gameState.rank}`;
        rankElement.textContent = gameState.rank;
        const xpPercentage = (gameState.xp / gameState.xpToNextLevel) * 100;
        xpBar.style.width = `${xpPercentage}%`;
        xpText.textContent = `XP: ${gameState.xp} / ${gameState.xpToNextLevel}`;
        employeeCountElement.textContent = `社員数: ${gameState.employees}人`;
        renderAllEmployees();
    }

    function renderAllEmployees() {
        employeeContainer.innerHTML = '';
        gameState.employeeCollection.forEach(employee => {
            const employeeElement = document.createElement('div');
            employeeElement.classList.add('employee');
            employeeElement.style.backgroundColor = employee.color;
            employeeContainer.appendChild(employeeElement);
        });
    }

    function startTimer(duration) {
        console.log("【startTimer】タイマー開始関数が呼ばれました。Duration: ", duration);
        // 既存のタイマーがあればクリア
        if (timerInterval) {
            clearInterval(timerInterval);
            console.log("【startTimer】既存のタイマーをクリアしました。");
        }

        gameState.timerRunning = true;
        gameState.timerEndTime = Date.now() + duration * 1000; // 終了時刻をミリ秒で記録
        saveGame(); // タイマーの状態を保存
        console.log("【startTimer】gameStateにタイマー状態を保存しました。timerRunning:", gameState.timerRunning, "timerEndTime:", gameState.timerEndTime);

        timerScreen.style.display = 'flex';
        console.log("【startTimer】timerScreenのdisplayをflexに設定しました。");
        updateTimerDisplay(); // 初回表示

        timerInterval = setInterval(updateTimerDisplay, 1000); // 1秒ごとに更新
        console.log("【startTimer】setIntervalを開始しました。");
    }

    function updateTimerDisplay() {
        const remainingTimeMs = gameState.timerEndTime - Date.now();
        const seconds = Math.max(0, Math.floor(remainingTimeMs / 1000)); // 残り秒数を計算（0未満にならないように）

        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;

        // console.log("【updateTimerDisplay】残り時間: ", seconds, "秒"); // 毎秒ログは多すぎるのでコメントアウト

        if (remainingTimeMs <= 0) {
            console.log("【updateTimerDisplay】残り時間が0以下になりました。completeTimerを呼び出します。");
            completeTimer();
        }
    }

    function completeTimer() {
        console.log("【completeTimer】タイマー完了処理を開始します。");
        clearInterval(timerInterval);
        timerInterval = null;
        timerScreen.style.display = 'none';
        gameState.timerRunning = false; // タイマー終了
        saveGame(); // タイマーの状態を保存

        playBeep();
        vibrate();

        if (gameState.isPomodoro) { // isPomodoroをgameStateから参照
            showNotification('集中時間終了！', '5分間の休憩に入りましょう。');
            completePomodoroLogic(); // ポモドーロ完了時のロジック
        } else {
            showNotification('休憩時間終了！', '次の集中時間に移りましょう。');
            startPomodoroButton.style.display = 'block';
            startBreakButton.style.display = 'none';
        }
        gameState.isPomodoro = !gameState.isPomodoro; // 次のタイマータイプに切り替え
        console.log("【completeTimer】タイマー完了処理が終了しました。");
    }

    function completePomodoroLogic() {
        gameState.xp += 5;
        gameState.pomodorosCompleted++;
        gameState.totalFocusTime += 25; // 25分集中したとして加算
        unlockAchievement('first_pomodoro');
        if (gameState.pomodorosCompleted >= 10) unlockAchievement('ten_pomodoros');
        if (gameState.employees < 10) {
            gameState.employees++;
            const newEmployeeType = employeeTypes[Math.floor(Math.random() * employeeTypes.length)];
            const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
            gameState.employeeCollection.push({
                type: newEmployeeType.type,
                color: newEmployeeType.color,
                assignedName: randomName,
            });
        }
        checkRankUp();
        updateUI();
        startPomodoroButton.style.display = 'none';
        startBreakButton.style.display = 'block';
    }

    function checkRankUp() {
        if (gameState.xp >= gameState.xpToNextLevel) {
            const currentRankIndex = ranks.indexOf(gameState.rank);
            if (currentRankIndex < ranks.length - 1) {
                gameState.rank = ranks[currentRankIndex + 1];
                gameState.xp = 0;
                gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * 1.5);
                unlockAchievement('rank_up');
                showRankUpScreen(gameState.rank); // 昇進演出を表示
            }
        }
    }
    function unlockAchievement(id) { if (!gameState.achievements.includes(id)) gameState.achievements.push(id); }
    function renderAchievements() {
        const achievementsList = document.getElementById('achievements-list');
        const totalFocusTimeElement = document.getElementById('total-focus-time');
        totalFocusTimeElement.textContent = `総集中時間: ${gameState.totalFocusTime}分`;
        achievementsList.innerHTML = '';
        achievements.forEach(a => { if (gameState.achievements.includes(a.id)) { const e = document.createElement('div'); e.innerHTML = `<h3>${a.name}</h3><p>${a.description}</p>`; el.appendChild(e); } });
    }

    function renderEmployeeCollection() {
        const employeeCollectionElement = document.getElementById('employee-collection');
        employeeCollectionElement.innerHTML = '';
        gameState.employeeCollection.forEach((employee, index) => {
            const employeeCard = document.createElement('div');
            employeeCard.classList.add('employee-card');
            employeeCard.innerHTML = `
                <h3 id="employee-name-${index}">${employee.assignedName} (${employee.type})</h3>
                <button class="edit-employee-name" data-index="${index}">編集</button>
            `;
            employeeCollectionElement.appendChild(employeeCard);
        });

        document.querySelectorAll('.edit-employee-name').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.dataset.index;
                const currentEmployee = gameState.employeeCollection[index];
                const nameElement = document.getElementById(`employee-name-${index}`);

                nameElement.innerHTML = `
                    <input type="text" id="edit-name-input-${index}" value="${currentEmployee.assignedName}">
                    <button class="save-employee-name" data-index="${index}">保存</button>
                `;

                document.querySelector(`.save-employee-name[data-index="${index}"]`).addEventListener('click', (saveEvent) => {
                    const newName = document.getElementById(`edit-name-input-${index}`).value.trim();
                    if (newName) {
                        gameState.employeeCollection[index].assignedName = newName;
                        saveGame();
                        renderEmployeeCollection();
                    } else {
                        alert('名前を入力してください！');
                    }
                });
            });
        });
    }

    function saveGame() { localStorage.setItem('pomoShachoState', JSON.stringify(gameState)); }

    function startAutoSave() {
        // 30秒ごとに自動保存
        autoSaveInterval = setInterval(() => {
            saveGame();
            console.log("【オートセーブ】ゲームの状態を自動保存しました。");
        }, 30 * 1000); 
    }

    function stopAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }
    }

    function resetGame() {
        console.log("【resetGame】リセット処理を開始します。");
        if (confirm('本当にゲームデータをリセットしますか？全ての進行状況が失われます。\nこの操作は元に戻せません。')) {
            console.log("【resetGame】ユーザーがリセットを承認しました。localStorageをクリアします。");
            localStorage.removeItem('pomoShachoState');
            // メモリ上のgameStateも初期値に戻す
            gameState = { ...initialGameState };
            stopAutoSave(); // オートセーブを停止
            console.log("【resetGame】gameStateを初期化しました。ページをリロードします。");
            location.reload(); // ページをリロードして初期状態に戻す
        } else {
            console.log("【resetGame】ユーザーがリセットをキャンセルしました。");
        }
    }

    // --- イベントリスナー ---
    startGameButton.addEventListener('click', () => {
        console.log("【startGameButton】'ゲーム開始'ボタンがクリックされました。");
        const name = shachoNameInput.value.trim();
        console.log("【startGameButton】入力された名前: ", name);
        if (name) {
            gameState.shachoName = name;
            console.log("【startGameButton】gameState.shachoNameを設定しました: ", gameState.shachoName);
            showMainApp();
            updateUI();
            startAutoSave(); // ゲーム開始時にオートセーブを開始
            console.log("【startGameButton】メインアプリを表示し、UIを更新しました。");
        } else {
            alert('名前を入力してください！');
            console.log("【startGameButton】名前が入力されていません。アラートを表示しました。");
        }
    });

    startPomodoroButton.addEventListener('click', () => {
        console.log("【startPomodoroButton】'集中開始'ボタンがクリックされました。");
        gameState.isPomodoro = true; // ポモドーロタイマーであることを設定
        startTimer(25 * 60);
    });
    startBreakButton.addEventListener('click', () => {
        console.log("【startBreakButton】'休憩開始'ボタンがクリックされました。");
        gameState.isPomodoro = false; // 休憩タイマーであることを設定
        startTimer(5 * 60);
    });
    collectionButton.addEventListener('click', () => {
        renderEmployeeCollection();
        collectionScreen.style.display = 'flex';
    });
    closeCollectionButton.addEventListener('click', () => collectionScreen.style.display = 'none');
    achievementsButton.addEventListener('click', () => {
        renderAchievements();
        achievementsScreen.style.display = 'flex';
    });
    closeAchievementsButton.addEventListener('click', () => achievementsScreen.style.display = 'none');

    settingsButton.addEventListener('click', () => {
        settingsScreen.style.display = 'flex';
    });
    closeSettingsButton.addEventListener('click', () => settingsScreen.style.display = 'none');
    resetGameButton.addEventListener('click', resetGame);

    helpButton.addEventListener('click', () => {
        helpScreen.style.display = 'flex';
    });
    closeHelpButton.addEventListener('click', () => helpScreen.style.display = 'none');

    closeRankUpButton.addEventListener('click', () => rankUpScreen.style.display = 'none');

    window.addEventListener('beforeunload', () => {
        saveGame();
        stopAutoSave(); // ページを離れる際にオートセーブを停止
    });

    // ページが非表示から表示に戻ったときにタイマーを更新
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && gameState.timerRunning) {
            console.log("【visibilitychange】ページがアクティブになりました。タイマーを更新します。");
            updateTimerDisplay();
        }
    });

    // --- 初期化の実行 ---
    init();

    // --- 音声再生 ---
    function playBeep() { try { const ac = new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(); const g = ac.createGain(); o.connect(g); g.connect(ac.destination); o.type = 'sine'; o.frequency.setValueAtTime(440, ac.currentTime); g.gain.setValueAtTime(0.5, ac.currentTime); o.start(); o.stop(ac.currentTime + 0.5); } catch (e) { console.error("音声の再生に失敗しました: ", e); } }

    function showRankUpScreen(newRank) {
        newRankDisplay.textContent = newRank;
        rankUpScreen.style.display = 'flex';
    }

    function showNotification(title, body) {
        if (Notification.permission === "granted") {
            new Notification(title, { body: body });
        }
    }

    function vibrate() {
        if ("vibrate" in navigator) {
            navigator.vibrate(200); // 200ミリ秒バイブレーション
        } else {
            console.warn("このデバイスはバイブレーションをサポートしていません。");
        }
    }
});