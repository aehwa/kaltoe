# 근무시간 관리 웹페이지

간단하고 직관적인 근무시간 관리 웹페이지입니다.

## 기능

### 1. 출근/퇴근 관리
- 출근 버튼을 누르면 출근 시간이 기록됩니다
- 출근 후 버튼이 "퇴근하기"로 변경됩니다
- 퇴근 버튼을 누르면 퇴근 시간이 기록됩니다

### 2. 실시간 시간 표시
- 현재 날짜와 시간을 실시간으로 표시
- 출근 후 경과 시간을 실시간으로 카운트
- 예상 퇴근 시간을 자동 계산

### 3. 휴가 옵션
- 정상근무 (8시간 + 휴게 1시간)
- 반반차 (6시간 + 휴게 1시간)
- 반차 (4시간 + 휴게 1시간)

### 4. 근무 기록
- 오늘의 출근/퇴근 기록을 시간순으로 표시
- 최대 10개의 기록을 저장

## 사용법

1. `index.html` 파일을 웹 브라우저에서 열기
2. "출근하기" 버튼을 클릭하여 출근
3. 휴가 옵션 선택 (선택사항)
4. "퇴근하기" 버튼을 클릭하여 퇴근

## 기술 스택

- HTML5
- CSS3 (반응형 디자인)
- JavaScript (ES6+)
- LocalStorage (데이터 저장)

## 파일 구조

```
├── index.html      # 메인 HTML 파일
├── styles.css      # 스타일시트
├── script.js       # JavaScript 로직
└── README.md       # 프로젝트 설명
```

## API 연동 준비

향후 데이터베이스 연동을 위해 `WorkTimeAPI` 클래스가 준비되어 있습니다:

```javascript
// API 사용 예시
const api = new WorkTimeAPI();
await api.saveWorkData(workData);
const data = await api.loadWorkData();
```

## 브라우저 지원

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 로컬 개발

1. 프로젝트 폴더로 이동
2. `index.html` 파일을 브라우저에서 열기
3. 또는 로컬 서버 실행:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx serve .
   ```

## 데이터 저장

현재는 브라우저의 LocalStorage를 사용하여 데이터를 저장합니다. 
페이지를 새로고침하거나 브라우저를 다시 열어도 데이터가 유지됩니다.
다만 다른 날짜가 되면 자동으로 데이터가 초기화됩니다. 