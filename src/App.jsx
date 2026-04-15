import { useState, useEffect, useCallback } from 'react';
import elementsData from './data/elements.json';
import './index.css';

const TYPES = ['number', 'symbol', 'name'];

// ユーティリティ：配列をシャッフル
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ユーティリティ：ランダム要素取得
const getRandomElements = (sourceArray, count, excludeElement) => {
  const filtered = sourceArray.filter(e => !excludeElement || e.number !== excludeElement.number);
  const shuffled = shuffleArray(filtered);
  return shuffled.slice(0, count);
};

function App() {
  const [gameMode, setGameMode] = useState(null); // null, 'basic', 'advance'
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [firstTry, setFirstTry] = useState(true);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionType, setQuestionType] = useState('symbol');
  const [choices, setChoices] = useState([]);
  const [status, setStatus] = useState('playing'); // 'playing', 'correct', 'wrong', 'finished'
  const [selectedChoice, setSelectedChoice] = useState(null);

  // ゲームの初期化
  const startGame = useCallback((mode) => {
    setGameMode(mode);
    let elementsToPlay = [];
    
    if (mode === 'basic') {
      // ベーシック版: 1〜20番を抽出して順番通りにソート
      elementsToPlay = elementsData
        .filter(e => e.number >= 1 && e.number <= 20)
        .sort((a, b) => a.number - b.number);
    } else {
      // アドバンス版: 全要素をシャッフル
      elementsToPlay = shuffleArray(elementsData);
    }
    
    setQueue(elementsToPlay);
    setCurrentIndex(0);
    setCorrectCount(0);
    loadQuestion(elementsToPlay[0], mode);
  }, []);

  const loadQuestion = (answerElement, currentMode) => {
    if (!answerElement) {
      setStatus('finished');
      return;
    }
    const qType = TYPES[Math.floor(Math.random() * TYPES.length)];
    
    // ダミーの選択肢は同じモードの要素群から選ぶ
    const pool = currentMode === 'basic' 
      ? elementsData.filter(e => e.number >= 1 && e.number <= 20) 
      : elementsData;
    
    const dummyElements = getRandomElements(pool, 3, answerElement);
    let options = shuffleArray([answerElement, ...dummyElements]);
    
    setCurrentQuestion(answerElement);
    setQuestionType(qType);
    setChoices(options);
    setStatus('playing');
    setSelectedChoice(null);
    setFirstTry(true);
  };

  const handleChoiceClick = (choice) => {
    if (status !== 'playing') return;
    
    setSelectedChoice(choice);
    
    if (choice.number === currentQuestion.number) {
      // 正解
      if (firstTry) {
        setCorrectCount(prev => prev + 1);
      }
      setStatus('correct');
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        loadQuestion(queue[nextIndex], gameMode);
      }, 1500);
    } else {
      // 不正解
      setFirstTry(false);
      setStatus('wrong');
      setTimeout(() => {
        setStatus('playing');
        setSelectedChoice(null);
      }, 800);
    }
  };

  if (gameMode === null) {
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>元素記号マスター</h1>
        </header>
        <main className="game-board mode-selection">
          <h2>モードを選択してください</h2>
          <div className="mode-buttons">
            <button className="mode-btn basic-btn" onClick={() => startGame('basic')}>
              <div className="mode-title">🔰 ベーシック版</div>
              <div className="mode-desc">1〜20番を順番通りに出題します。<br/>まずはここから完璧にしよう！</div>
            </button>
            <button className="mode-btn advance-btn" onClick={() => startGame('advance')}>
              <div className="mode-title">🔥 アドバンス版</div>
              <div className="mode-desc">全36種類をランダムに出題します。<br/>これができれば高校化学基礎はバッチリ！</div>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (status === 'finished') {
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>元素記号マスター</h1>
        </header>
        <main className="game-board result-board">
          <h2>全 {queue.length} 問 終了！</h2>
          <div className="score-display">
            正解数: <span>{correctCount}</span> / {queue.length}
          </div>
          <p className="score-message">
            {correctCount === queue.length ? 'パーフェクト！すべて覚えましたね！' : 'もっと繰り返し遊んで覚えよう！'}
          </p>
          <div className="result-actions">
            <button className="restart-btn" onClick={() => startGame(gameMode)}>
              もう1周プレイする
            </button>
            <button className="back-mode-btn" onClick={() => setGameMode(null)}>
              モード選択に戻る
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!currentQuestion) return <div className="loading">読み込み中...</div>;

  // 問題部分の表示ロジック
  const renderQuestionPart = () => {
    switch (questionType) {
      case 'number': return `番号： ${currentQuestion.number} 番`;
      case 'symbol': return `記号： ${currentQuestion.symbol}`;
      case 'name':   return `名前： ${currentQuestion.name}`;
      default: return '';
    }
  };

  // 選択肢の表示ロジック
  const renderChoiceLabel = (choice) => {
    const parts = [];
    if (questionType !== 'number') parts.push(`${choice.number}番`);
    if (questionType !== 'symbol') parts.push(choice.symbol);
    if (questionType !== 'name') parts.push(choice.name);
    return parts.join(' - ');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>元素記号マスター</h1>
        <div className="progress-info">
          問題: {currentIndex + 1} / {queue.length} 
          <span className="correct-badge"> 正解: {correctCount}回</span>
        </div>
      </header>
      
      <main className="game-board">
        {/* ヒントエリア */}
        <section className="hints-section">
          <div className="hints-title">💡 その元素といえばこれ！</div>
          <ul className="hints-list">
            {currentQuestion.hints.map((hint, index) => (
              <li key={index} className="hint-item">{hint}</li>
            ))}
          </ul>
        </section>

        {/* 問題エリア */}
        <section className="question-section">
          <h2>この元素はどれ？</h2>
          <div className="question-box">
            {renderQuestionPart()}
          </div>
        </section>

        {/* 選択肢エリア */}
        <section className="choices-section">
          {choices.map((choice, index) => {
            let btnClass = "choice-btn";
            if (selectedChoice && selectedChoice.number === choice.number) {
              if (selectedChoice.number === currentQuestion.number) {
                btnClass += " correct";
              } else {
                btnClass += " wrong";
              }
            } else if (status === 'correct' && choice.number === currentQuestion.number) {
               // 自分が間違えた後でも、正解だったボタンをハイライトする（任意）
            }
            
            return (
               <button 
                key={index} 
                className={btnClass}
                onClick={() => handleChoiceClick(choice)}
                disabled={status === 'correct'}
              >
                {renderChoiceLabel(choice)}
              </button>
            )
          })}
        </section>
      </main>

      {/* 正解時オーバーレイ */}
      {status === 'correct' && (
        <div className="overlay overlay-correct">
          <div className="overlay-content">
             <div className="emoji">⭕</div>
             <div className="correct-info">
               <span className="info-number">{currentQuestion.number}</span>
               <span className="info-symbol">{currentQuestion.symbol}</span>
               <span className="info-name">{currentQuestion.name}</span>
             </div>
          </div>
        </div>
      )}

      {/* 不正解時オーバーレイ */}
      {status === 'wrong' && (
        <div className="overlay overlay-wrong">
          <div className="overlay-content">
             <div className="emoji bounce">❌</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
