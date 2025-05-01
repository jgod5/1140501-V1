alert('exam');

// 全域變數
let questionBank = {}; // 所有科目的題庫
let currentSubject = '程式設計'; // 當前選擇的科目
let currentQuestions = []; // 當前考試的題目
let userAnswers = {}; // 用戶答案
let wrongQuestions = {}; // 錯題記錄，存在 localStorage
let startTime; // 開始時間
let timerInterval; // 計時器
let examFinished = false; // 考試是否結束

// DOM 元素
const subjectButtons = document.querySelectorAll('.subject-btn');
const timer = document.querySelector('.timer');
const endButton = document.querySelector('.end-btn');
const questionsContainer = document.getElementById('questions-container');
const progressBar = document.querySelector('.progress');
const resultsSection = document.querySelector('.results');
const exportButton = document.querySelector('.export-btn');


// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 從 localStorage 載入錯題記錄
    loadWrongQuestions();
    
    // 載入第一個科目的題庫
    loadQuestionBank(currentSubject);
    
    // 設置事件監聽器
    setupEventListeners();
    
    // 開始計時
    startTimer();
});



// 載入錯題記錄
function loadWrongQuestions() {
    const storedWrongQuestions = localStorage.getItem('wrongQuestions');
    if (storedWrongQuestions) {
        wrongQuestions = JSON.parse(storedWrongQuestions);
    }
}

// 保存錯題記錄
function saveWrongQuestions() {
    localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestions));
}

// 設置事件監聽器
function setupEventListeners() {
    // 科目選擇按鈕
    subjectButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (examFinished) return;
            
            // 更新樣式
            subjectButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 切換科目
            currentSubject = button.textContent;
            loadQuestionBank(currentSubject);
        });
    });
    
    // 結束考試按鈕
    endButton.addEventListener('click', () => {
        if (confirm('確定要結束考試嗎？')) {
            finishExam();
        }
    });
    
    // 匯出錯題按鈕
    exportButton.addEventListener('click', exportWrongQuestions);
}

// 儲存題庫到本地存儲
function saveQuestionBankToLocal(subject, questions) {
  localStorage.setItem(`questionBank_${subject}`, JSON.stringify(questions));
}

// 從本地存儲載入題庫
function loadQuestionBankFromLocal(subject) {
  const storedQuestions = localStorage.getItem(`questionBank_${subject}`);
  return storedQuestions ? JSON.parse(storedQuestions) : null;
}
// 修改載入函數
function loadQuestionBank(subject) {
  // 先嘗試從本地存儲載入
  const localQuestions = loadQuestionBankFromLocal(subject);
  
  if (localQuestions) {
    // 使用本地存儲的題庫
    questionBank[subject] = localQuestions;
    generateRandomExam();
    renderQuestions();
  } else {
    // 從伺服器載入
    loadQuestionBankFromFile(subject)
      .then(questions => {
        // 保存到本地存儲
        saveQuestionBankToLocal(subject, questions);
        
        // 使用載入的題庫
        questionBank[subject] = questions;
        generateRandomExam();
        renderQuestions();
      })
      .catch(error => {
        // 使用模擬題庫
        questionBank[subject] = generateMockQuestions(subject);
        generateRandomExam();
        renderQuestions();
      });
  }
}

// 生成模擬題庫
function generateMockQuestions(subject) {
    const questions = [];
    
    // 生成35道是非題
    for (let i = 1; i <= 35; i++) {
        questions.push({
            id: `tf_${i}`,
            type: 'true-false',
            question: `【是非題】${subject}相關的是非題 #${i}`,
            options: ['是', '否'],
            answer: Math.random() > 0.5 ? '是' : '否',
            explanation: 這是${subject}是非題 #${i} 的解釋說明。
        });
    }
    
    // 生成65道選擇題
    for (let i = 1; i <= 65; i++) {
        questions.push({
            id: `mc_${i}`,
            type: 'multiple-choice',
            question: `【選擇題】${subject}相關的四選一選擇題 #${i}`,
            options: ['選項A', '選項B', '選項C', '選項D'],
            answer: ['選項A', '選項B', '選項C', '選項D'][Math.floor(Math.random() * 4)],
            explanation: 這是${subject}選擇題 #${i} 的解釋說明。
        });
    }
    
    return questions;
}

// 生成隨機考試
function generateRandomExam() {
    const allQuestions = questionBank[currentSubject];
    if (!allQuestions) return;
    
    const tfQuestions = allQuestions.filter(q => q.type === 'true-false');
    const mcQuestions = allQuestions.filter(q => q.type === 'multiple-choice');
    
    // 隨機選擇35道是非題和65道選擇題
    const selectedTF = shuffleArray(tfQuestions).slice(0, 35);
    const selectedMC = shuffleArray(mcQuestions).slice(0, 65);
    
    currentQuestions = [...selectedTF, ...selectedMC];
    userAnswers = {}; // 重置用戶答案
}

// 陣列隨機排序（Fisher-Yates Shuffle 算法）
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 渲染題目
function renderQuestions() {
    if (currentQuestions.length === 0) return;
    
    questionsContainer.innerHTML = '';
    
    currentQuestions.forEach((question, index) => {
        const questionEl = document.createElement('div');
        questionEl.className = 'question-container';
        questionEl.dataset.id = question.id;
        
        // 檢查是否為錯題
        const isWrongBefore = wrongQuestions[question.id];
        
        // 警告標記（如果之前答錯過）
        const warningIcon = isWrongBefore ? 
            '<span class="warning-icon" style="display: inline-block;">❗</span>' : 
            '<span class="warning-icon">❗</span>';
        
        questionEl.innerHTML = `
            <div class="question-header">
                ${warningIcon}
                <span class="question-number">${index + 1}.</span>
                <div class="question-text">${question.question}</div>
            </div>
            <div class="options-container ${question.type === 'true-false' ? 'true-false' : ''}">
                ${question.options.map(option => `
                    <div class="option" data-value="${option}">${option}</div>
                `).join('')}
            </div>
            <div class="feedback">
                <div class="feedback-content"></div>
                <div class="correct-answer"></div>
                <div class="explanation"></div>
            </div>
        `;
        
        questionsContainer.appendChild(questionEl);
        
        // 綁定答題事件
        const options = questionEl.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                if (userAnswers[question.id]) return; // 防止重複答題
                
                const selectedValue = option.dataset.value;
                userAnswers[question.id] = selectedValue;
                
                // 標記選中項
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                // 檢查答案
                checkAnswer(question, selectedValue, questionEl);
                
                // 更新進度條
                updateProgressBar();
            });
        });
    });
}

// 檢查答案
function checkAnswer(question, userAnswer, questionEl) {
    const feedback = questionEl.querySelector('.feedback');
    const feedbackContent = questionEl.querySelector('.feedback-content');
    const correctAnswerEl = questionEl.querySelector('.correct-answer');
    const explanationEl = questionEl.querySelector('.explanation');
    const options = questionEl.querySelectorAll('.option');
    
    const isCorrect = userAnswer === question.answer;
    
    // 顯示正確或錯誤樣式
    options.forEach(option => {
        if (option.dataset.value === userAnswer) {
            option.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
        if (option.dataset.value === question.answer && !isCorrect) {
            option.classList.add('correct');
        }
    });
    
    // 設置反饋信息
    feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackContent.textContent = isCorrect ? '✓ 回答正確！' : '✗ 回答錯誤！';
    correctAnswerEl.textContent = isCorrect ? '' : `正確答案：${question.answer}`;
    explanationEl.textContent = question.explanation;
    feedback.style.display = 'block';
    
    // 如果答錯，更新錯題記錄
    if (!isCorrect) {
        wrongQuestions[question.id] = true;
        saveWrongQuestions();
    } else if (wrongQuestions[question.id]) {
        // 如果之前答錯，現在答對了，從錯題記錄中移除
        delete wrongQuestions[question.id];
        saveWrongQuestions();
    }
}

// 更新進度條
function updateProgressBar() {
    const answeredCount = Object.keys(userAnswers).length;
    const totalCount = currentQuestions.length;
    const percentage = (answeredCount / totalCount) * 100;
    
    progressBar.style.width = `${percentage}%`;
    
    // 如果全部答完，提示結束考試
    if (answeredCount === totalCount) {
        setTimeout(() => {
            if (confirm('您已完成所有題目，是否結束考試？')) {
                finishExam();
            }
        }, 500);
    }
}

// 開始計時
function startTimer() {
    startTime = new Date();
    
    timerInterval = setInterval(() => {
        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime - startTime) / 1000);
        
        const hours = Math.floor(elapsedTime / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0');
        const seconds = (elapsedTime % 60).toString().padStart(2, '0');
        
        timer.textContent = `${hours}:${minutes}:${seconds}`;
    }, 1000);
}

// 結束考試
function finishExam() {
    clearInterval(timerInterval);
    examFinished = true;
    
    // 計算得分
    const { score, accuracy, tfCorrect, mcCorrect } = calculateScore();
    
    // 顯示結果
    const timeSpentEl = document.getElementById('time-spent');
    const accuracyEl = document.getElementById('accuracy');
    const finalScoreEl = document.getElementById('final-score');
    
    timeSpentEl.textContent = timer.textContent;
    accuracyEl.textContent = `${accuracy}%`;
    finalScoreEl.textContent = score;
    
    // 隱藏題目，顯示結果
    document.querySelector('.exam-content').style.display = 'none';
    resultsSection.style.display = 'block';
}

// 計算得分
function calculateScore() {
    let tfCorrect = 0, tfIncorrect = 0;
    let mcCorrect = 0, mcIncorrect = 0;
    
    currentQuestions.forEach(question => {
        const userAnswer = userAnswers[question.id];
        
        // 沒有作答
        if (!userAnswer) {
            return;
        }
        
        const isCorrect = userAnswer === question.answer;
        
        if (question.type === 'true-false') {
            if (isCorrect) {
                tfCorrect++;
            } else {
                tfIncorrect++;
            }
        } else {
            if (isCorrect) {
                mcCorrect++;
            } else {
                mcIncorrect++;
            }
        }
    });
    
    // 是非題：每題1分，答錯扣1分
    // 選擇題：每題1分，答錯不倒扣
    const tfScore = tfCorrect - tfIncorrect;
    const mcScore = mcCorrect;
    
    const totalScore = tfScore + mcScore;
    const totalAnswered = tfCorrect + tfIncorrect + mcCorrect + mcIncorrect;
    const totalCorrect = tfCorrect + mcCorrect;
    
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    
    return {
        score: Math.max(0, totalScore), // 確保分數不為負
        accuracy,
        tfCorrect,
        mcCorrect
    };
}

// 匯出錯題
function exportWrongQuestions() {
    // 找出所有的錯題
    const wrongQuestionsData = currentQuestions.filter(q => wrongQuestions[q.id]);
    
    if (wrongQuestionsData.length === 0) {
        alert('沒有錯題可匯出！');
        return;
    }
    
    // 格式化錯題為CSV格式
    let csvContent = "題號,題型,題目,正確答案,解釋\n";
    
    wrongQuestionsData.forEach(q => {
        const questionType = q.type === 'true-false' ? '是非題' : '選擇題';
        csvContent += `${q.id},${questionType},"${q.question}","${q.answer}","${q.explanation}"\n`;
    });
    
    // 創建下載連結
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentSubject}_錯題集_${new Date().toLocaleDateString()}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}