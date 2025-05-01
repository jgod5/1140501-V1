// 題庫檔案格式示例 (JSON 格式)
/*
題庫檔案名稱：程式設計_題庫.json, 網頁開發_題庫.json 等
題庫檔案格式：
[
  {
    "id": "tf_1",
    "type": "true-false",
    "question": "JavaScript 是一種編譯語言？",
    "options": ["是", "否"],
    "answer": "否",
    "explanation": "JavaScript 是一種解釋型語言，不需要事先編譯。"
  },
  {
    "id": "mc_1",
    "type": "multiple-choice",
    "question": "以下哪個不是 JavaScript 的基本數據類型？",
    "options": ["String", "Boolean", "Array", "Number"],
    "answer": "Array",
    "explanation": "Array 是一種物件類型，不是基本數據類型。JavaScript 的基本數據類型包括：String, Number,     Boolean, null, undefined, Symbol 和 BigInt。"
  }
]
*/


alert('questions');

// 儲存題庫到本地存儲
function saveQuestionBankToLocal(subject, questions) {
  alert('subject');
  localStorage.setItem(`questionBank_${subject}`, JSON.stringify(questions));
}

// 從本地存儲載入題庫
function loadQuestionBankFromLocal(subject) {
  alert('從本地存儲載入題庫');
  const storedQuestions = localStorage.getItem(`questionBank_${subject}`);
  return storedQuestions ? JSON.parse(storedQuestions) : null;
}

// 修改載入函數
function loadQuestionBank(subject) {
  // 先嘗試從本地存儲載入
  alert('loadQ');
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

function loadQuestionBankFromFile(subject) {
  const fileName = `${subject}_題庫.json`;

  return fetch(`題庫/${fileName}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('題庫載入失敗');
      }
      return response.json();
    });
}
