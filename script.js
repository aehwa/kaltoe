class WorkTimeManager {
    constructor() {
        this.workData = {
            startTime: null,
            endTime: null,
            calculatedEndTime: null, // 계산된 퇴근 시간을 저장
            leaveHours: 0,
            isWorking: false
        };
        
        // 근무 이력 저장소 추가
        this.workHistory = {};
        
        this.elements = {
            currentDate: document.getElementById('currentDate'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            workBtn: document.getElementById('workBtn'),
            timeInfo: document.getElementById('timeInfo'),
            startTime: document.getElementById('startTime'),
            elapsedTime: document.getElementById('elapsedTime'),
            endTime: document.getElementById('endTime'),
            leaveOptions: document.getElementById('leaveOptions'),
            editStartTimeBtn: document.getElementById('editStartTimeBtn'),
            editTimeModal: document.getElementById('editTimeModal'),
            editHour: document.getElementById('editHour'),
            editMinute: document.getElementById('editMinute'),
            cancelEditBtn: document.getElementById('cancelEditBtn'),
            confirmEditBtn: document.getElementById('confirmEditBtn'),
            remainingTime: document.getElementById('remainingTime'),
            remainingText: document.getElementById('remainingText'),
            workSummary: document.getElementById('workSummary'),
            summaryStartTime: document.getElementById('summaryStartTime'),
            summaryEndTime: document.getElementById('summaryEndTime'),
            summaryTotalTime: document.getElementById('summaryTotalTime'),
            summaryWorkType: document.getElementById('summaryWorkType'),
            summaryOvertime: document.getElementById('summaryOvertime'),
            summaryMessage: document.getElementById('summaryMessage'),
            historyListBeforeWork: document.getElementById('historyListBeforeWork')
        };
        
        this.elapsedTimer = null;
        this.dateTimer = null; // 날짜 업데이트 타이머 추가
        this.lastDateString = null; // 날짜 변경 감지를 위한 변수 추가
        this.init();
    }
    
    init() {
        // DOM 요소들이 모두 존재하는지 확인
        if (!this.validateElements()) {
            console.error('필수 DOM 요소를 찾을 수 없습니다.');
            return;
        }
        
        this.updateCurrentDate();
        this.loadWorkData();
        this.loadWorkHistory();
        this.setupEventListeners();
        this.updateDisplay();
        this.startElapsedTimer();
        
        // 1초마다 현재 날짜 업데이트
        this.dateTimer = setInterval(() => this.updateCurrentDate(), 1000);
    }
    
    // DOM 요소 검증 메서드 추가
    validateElements() {
        const requiredElements = [
            'currentDate', 'statusIndicator', 'statusText', 'workBtn',
            'timeInfo', 'startTime', 'elapsedTime', 'endTime',
            'leaveOptions', 'remainingTime', 'remainingText'
        ];
        
        for (const elementId of requiredElements) {
            if (!this.elements[elementId]) {
                console.error(`필수 요소를 찾을 수 없습니다: ${elementId}`);
                return false;
            }
        }
        return true;
    }
    
    // 앱 정리 메서드 추가
    destroy() {
        if (this.elapsedTimer) {
            clearInterval(this.elapsedTimer);
            this.elapsedTimer = null;
        }
        if (this.dateTimer) {
            clearInterval(this.dateTimer);
            this.dateTimer = null;
        }
        // 이벤트 리스너 정리
        this.removeEventListeners();
    }
    
    // 이벤트 리스너 정리 메서드 추가
    removeEventListeners() {
        // workBtn 이벤트 리스너는 별도로 관리하지 않으므로 생략
        // 휴가 옵션 버튼들의 이벤트 리스너는 동적으로 추가되므로 별도 정리 불필요
        // 모달 관련 이벤트 리스너들도 동적으로 추가되므로 별도 정리 불필요
    }
    
    updateCurrentDate() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        const newDateString = now.toLocaleDateString('ko-KR', options);
        
        // 날짜가 변경되었는지 확인 (자정 처리)
        const currentDateString = now.toDateString();
        if (this.lastDateString && this.lastDateString !== currentDateString) {
            // 날짜가 변경되었으면 calculatedEndTime 재계산
            if (this.workData.isWorking && this.workData.startTime) {
                this.updateEndTime();
            }
        }
        this.lastDateString = currentDateString;
        
        // 값이 변경된 경우에만 DOM 업데이트
        if (this.elements.currentDate.textContent !== newDateString) {
            this.elements.currentDate.textContent = newDateString;
        }
    }
    
    setupEventListeners() {
        this.elements.workBtn.addEventListener('click', () => this.toggleWork());
        
        // 휴가 옵션 버튼들
        document.querySelectorAll('.leave-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectLeaveOption(parseInt(e.target.dataset.hours));
            });
        });
        
        // 출근시간 수정 관련 이벤트
        this.elements.editStartTimeBtn.addEventListener('click', () => this.openEditTimeModal());
        this.elements.cancelEditBtn.addEventListener('click', () => this.closeEditTimeModal());
        this.elements.confirmEditBtn.addEventListener('click', () => this.confirmEditTime());
        
        // 모달 외부 클릭 시 닫기
        this.elements.editTimeModal.addEventListener('click', (e) => {
            if (e.target === this.elements.editTimeModal) {
                this.closeEditTimeModal();
            }
        });
        
        // Enter 키로 확인
        this.elements.editHour.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.confirmEditTime();
        });
        this.elements.editMinute.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.confirmEditTime();
        });
    }
    
    toggleWork() {
        if (!this.workData.isWorking) {
            this.startWork();
        } else {
            this.endWork();
        }
    }
    

    
    startWork() {
        // 오늘 이미 출근한 기록이 있는지 확인
        const today = new Date().toDateString();
        const startDate = this.workData.startTime ? this.workData.startTime.toDateString() : null;
        
        if (startDate === today && !this.workData.isWorking) {
            // 오늘 이미 출근했지만 퇴근한 상태 - 이어서 근무
            this.workData.isWorking = true;
            this.elements.workBtn.textContent = '퇴근하기';
            this.elements.statusText.textContent = '근무 중';
            this.elements.statusIndicator.className = 'status-indicator on-duty';
            
            this.elements.timeInfo.style.display = 'grid';
            this.elements.leaveOptions.style.display = 'block';
            this.elements.workSummary.style.display = 'none';
            
            // 휴가 옵션 버튼 상태 복원
            this.updateLeaveButtonStates(this.workData.leaveHours || 0);
            
            // 타이머 시작
            this.startElapsedTimer();
            
            this.saveWorkData();
            this.updateDisplay();
            this.updateWorkButtonState();
            return;
        }
        
        // 새로운 출근
        this.workData.startTime = new Date();
        this.workData.isWorking = true;
        this.workData.leaveHours = 0; // 기본값: 정상근무
        
        this.elements.workBtn.textContent = '퇴근하기';
        this.elements.statusText.textContent = '근무 중';
        this.elements.statusIndicator.className = 'status-indicator on-duty';
        
        this.elements.timeInfo.style.display = 'grid';
        this.elements.leaveOptions.style.display = 'block';
        this.elements.workSummary.style.display = 'none';
        
        // 정상근무 버튼을 기본으로 활성화
        this.updateLeaveButtonStates(0);
        
        // 타이머 시작
        this.startElapsedTimer();
        
        this.saveWorkData();
        this.updateDisplay();
        this.updateWorkButtonState();
    }
    
    endWork() {
        this.workData.endTime = new Date();
        this.workData.isWorking = false;
        
        // 먼저 데이터 저장 (showWorkSummary에서 오류가 발생해도 데이터는 저장)
        this.saveWorkData();
        
        this.elements.workBtn.textContent = '다시 출근';
        this.elements.statusText.textContent = '퇴근 완료';
        this.elements.statusIndicator.className = 'status-indicator off-duty';
        
        this.elements.timeInfo.style.display = 'none';
        this.elements.leaveOptions.style.display = 'none';
        
        // 근무 요약 표시
        this.showWorkSummary();
        
        this.updateDisplay();
        
        // 퇴근 후 이력 표시 업데이트
        this.updateHistorySectionVisibility();
        
        // 타이머 정지
        if (this.elapsedTimer) {
            clearInterval(this.elapsedTimer);
            this.elapsedTimer = null;
        }
    }
    
    selectLeaveOption(hours) {
        this.workData.leaveHours = hours;
        
        // 버튼 활성화 상태 업데이트
        this.updateLeaveButtonStates(hours);
        
        this.saveWorkData();
        this.updateDisplay();
        this.updateWorkButtonState();
    }
    
    // 휴가 버튼 상태 업데이트를 별도 메서드로 분리
    updateLeaveButtonStates(activeHours) {
        document.querySelectorAll('.leave-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.hours) === activeHours) {
                btn.classList.add('active');
            }
        });
    }
    
    updateDisplay() {
        if (this.workData.startTime) {
            this.elements.startTime.textContent = this.formatTime(this.workData.startTime);
            this.updateElapsedTime();
            this.updateEndTime();
        }
        
        // 출근 상태에 따라 이력 표시 제어 (DOM이 로드된 후에만)
        setTimeout(() => this.updateHistorySectionVisibility(), 0);
    }

    updateHistorySectionVisibility() {
        const historySection = document.getElementById('historyBeforeWork');
        if (!historySection) return;
        if (this.workData.isWorking) {
            // 근무 중: 숨김
            historySection.style.display = 'none';
        } else {
            // 근무 중이 아닐 때(출근 전, 퇴근 후): 표시
            historySection.style.display = 'block';
            // 이력 데이터를 다시 로드하여 최신 상태로 표시
            this.loadWorkHistory();
            this.showWorkHistoryInUIForMain();
        }
    }

    showWorkHistoryInUIForMain() {
        const history = this.getWorkHistory();
        const historyList = document.getElementById('historyListBeforeWork');
        if (!historyList) {
            return;
        }
        // 기존 내용 초기화
        historyList.innerHTML = '';
        if (Object.keys(history).length === 0) {
            historyList.innerHTML = '<div class="no-history">저장된 근무 기록이 없습니다.</div>';
            return;
        }
        
        // 날짜 기반 정렬 수정: Date 객체로 변환하여 정확한 날짜 순서로 정렬
        const sortedDates = Object.keys(history).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateB - dateA; // 최신 날짜가 먼저 오도록 내림차순 정렬
        }).slice(0, 30);
        
        sortedDates.forEach(dateKey => {
            const record = history[dateKey];
            const startTime = this.formatTime(record.startTime);
            const endTime = this.formatTime(record.endTime);
            const totalHours = Math.floor(record.totalHours);
            const totalMinutes = Math.floor((record.totalHours - totalHours) * 60);
            const workType = this.getWorkTypeText(record.leaveHours);
            
            // 초과시간 계산
            const requiredHours = this.calculateRequiredHours(record.leaveHours);
            const overtimeHours = Math.max(0, record.totalHours - requiredHours);
            const overtimeHoursInt = Math.floor(overtimeHours);
            const overtimeMinutesInt = Math.floor((overtimeHours - overtimeHoursInt) * 60);
            
            // 날짜 포맷팅 (월/일)
            const date = new Date(dateKey);
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            // 초과시간이 0일 때는 표시하지 않음
            const overtimeDisplay = overtimeHours > 0.1 ? 
                `<div class="history-overtime">${overtimeHoursInt}h ${overtimeMinutesInt}m</div>` : 
                `<div class="history-overtime-none">-</div>`;
            
            historyItem.innerHTML = `
                <div class="history-date">${formattedDate}</div>
                <div class="history-time">${startTime} ~ ${endTime}</div>
                <div class="history-duration">${totalHours}h ${totalMinutes}m</div>
                <div class="history-type">${workType}</div>
                ${overtimeDisplay}
            `;
            historyList.appendChild(historyItem);
        });
    }
    
    updateElapsedTime() {
        if (!this.workData.startTime) return;
        
        const now = new Date();
        const elapsed = now - this.workData.startTime;
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
        
        const newTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 값이 변경된 경우에만 DOM 업데이트
        if (this.elements.elapsedTime.textContent !== newTimeString) {
            this.elements.elapsedTime.textContent = newTimeString;
            
            // 경과 시간이 업데이트될 때마다 퇴근 버튼 상태 확인
            if (this.workData.isWorking) {
                this.updateWorkButtonState();
            }
        }
    }
    
    updateEndTime() {
        if (!this.workData.startTime) return;
        
        try {
            const totalRequiredHours = this.calculateRequiredHours(this.workData.leaveHours);
            const endTime = new Date(this.workData.startTime);
            endTime.setHours(endTime.getHours() + totalRequiredHours);
            
            // 계산된 퇴근 시간을 저장
            this.workData.calculatedEndTime = endTime;
            
            this.elements.endTime.textContent = this.formatTime(endTime);
            
            // 남은 시간 계산 및 표시
            this.updateRemainingTime(endTime);
        } catch (error) {
            console.error('퇴근 시간 계산 중 오류:', error);
        }
    }
    
    updateRemainingTime(endTime) {
        if (!this.workData.isWorking) {
            if (this.elements.remainingTime.style.display !== 'none') {
                this.elements.remainingTime.style.display = 'none';
            }
            return;
        }
        
        const now = new Date();
        const remaining = endTime - now;
        
        let newText = '';
        let newClassName = '';
        
        if (remaining <= 0) {
            // 퇴근 시간이 지남 - 초과 시간 계산
            const overtime = Math.abs(remaining);
            const overtimeHours = Math.floor(overtime / (1000 * 60 * 60));
            const overtimeMinutes = Math.floor((overtime % (1000 * 60 * 60)) / (1000 * 60));
            
            if (overtimeMinutes <= 30 && overtimeHours === 0) {
                // 퇴근 완료 후 30분 이하 - 초록색 (칼퇴 성공!)
                newClassName = 'remaining-time complete';
                if (overtimeMinutes === 0) {
                    newText = '퇴근 가능합니다!';
                } else {
                    newText = `어서 퇴근하세요! (${overtimeMinutes}분 초과)`;
                }
            } else {
                // 퇴근 완료 후 30분 초과 또는 1시간 이상 초과 - 빨간색 (늦은 퇴근)
                newClassName = 'remaining-time urgent';
                if (overtimeHours > 0) {
                    newText = `퇴근 ${overtimeHours}시간 ${overtimeMinutes}분 초과!`;
                } else {
                    newText = `퇴근 ${overtimeMinutes}분 초과!`;
                }
            }
        } else {
            // 퇴근 시간까지 남음
            const remainingHours = Math.floor(remaining / (1000 * 60 * 60));
            const remainingMinutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            
            if (remainingHours === 0 && remainingMinutes <= 30) {
                // 30분 이하 남음 - 초록색 (칼퇴 준비!)
                newClassName = 'remaining-time complete';
                newText = `퇴근까지 ${remainingMinutes}분 남음`;
            } else {
                // 일반 표시 - 회색
                newClassName = 'remaining-time';
                if (remainingHours > 0) {
                    newText = `퇴근까지 ${remainingHours}시간 ${remainingMinutes}분 남음`;
                } else {
                    newText = `퇴근까지 ${remainingMinutes}분 남음`;
                }
            }
        }
        
        // 값이 변경된 경우에만 DOM 업데이트
        if (this.elements.remainingTime.style.display !== 'block') {
            this.elements.remainingTime.style.display = 'block';
        }
        if (this.elements.remainingTime.className !== newClassName) {
            this.elements.remainingTime.className = newClassName;
        }
        if (this.elements.remainingText.textContent !== newText) {
            this.elements.remainingText.textContent = newText;
        }
    }
    
    startElapsedTimer() {
        // 기존 타이머가 있다면 정리
        if (this.elapsedTimer) {
            clearInterval(this.elapsedTimer);
        }
        
        this.elapsedTimer = setInterval(() => {
            try {
                if (this.workData.isWorking) {
                    this.updateElapsedTime();
                    // 남은 시간도 실시간으로 업데이트 (저장된 calculatedEndTime 사용)
                    if (this.workData.calculatedEndTime) {
                        this.updateRemainingTime(this.workData.calculatedEndTime);
                    }
                }
            } catch (error) {
                console.error('타이머 업데이트 중 오류:', error);
            }
        }, 1000);
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }
    
    saveWorkData() {
        try {
            const dataToSave = {
                ...this.workData,
                startTime: this.workData.startTime ? this.workData.startTime.toISOString() : null,
                endTime: this.workData.endTime ? this.workData.endTime.toISOString() : null,
                calculatedEndTime: this.workData.calculatedEndTime ? this.workData.calculatedEndTime.toISOString() : null
            };
            
            localStorage.setItem('workTimeData', JSON.stringify(dataToSave));
            
            // 근무 이력도 함께 저장
            this.saveWorkHistory();
        } catch (error) {
            console.error('데이터 저장 중 오류:', error);
        }
    }
    
    saveWorkHistory() {
        try {
            // 오늘 날짜를 키로 사용
            const today = new Date().toDateString();
            
            // 퇴근이 완료된 경우에만 이력에 저장
            if (this.workData.startTime && this.workData.endTime) {
                const workRecord = {
                    startTime: this.workData.startTime.toISOString(),
                    endTime: this.workData.endTime.toISOString(),
                    leaveHours: this.workData.leaveHours,
                    totalHours: this.calculateTotalWorkHours(),
                    date: today
                };
                
                this.workHistory[today] = workRecord;
                
                // 최근 30일간의 이력만 유지
                this.cleanupOldHistory();
                
                localStorage.setItem('workHistory', JSON.stringify(this.workHistory));
            }
        } catch (error) {
            console.error('근무 이력 저장 중 오류:', error);
        }
    }
    
    loadWorkHistory() {
        try {
            const savedHistory = localStorage.getItem('workHistory');
            if (savedHistory) {
                this.workHistory = JSON.parse(savedHistory);
                // Date 객체로 변환
                Object.keys(this.workHistory).forEach(dateKey => {
                    const record = this.workHistory[dateKey];
                    record.startTime = new Date(record.startTime);
                    record.endTime = new Date(record.endTime);
                });
            }
        } catch (error) {
            console.error('근무 이력 로드 중 오류:', error);
            this.workHistory = {};
        }
    }
    
    cleanupOldHistory() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        Object.keys(this.workHistory).forEach(dateKey => {
            const recordDate = new Date(dateKey);
            if (recordDate < thirtyDaysAgo) {
                delete this.workHistory[dateKey];
            }
        });
    }
    
    calculateTotalWorkHours() {
        if (!this.workData.startTime || !this.workData.endTime) return 0;
        
        const totalTime = this.workData.endTime - this.workData.startTime;
        return totalTime / (1000 * 60 * 60); // 시간 단위로 반환
    }
    
    getWorkHistory() {
        return this.workHistory;
    }
    
    // 근무 이력 확인 함수 (콘솔에서 사용 가능)
    showWorkHistory() {
        console.log('=== 근무 이력 ===');
        const history = this.getWorkHistory();
        
        if (Object.keys(history).length === 0) {
            console.log('저장된 근무 이력이 없습니다.');
            return;
        }
        
        Object.keys(history).sort().reverse().forEach(dateKey => {
            const record = history[dateKey];
            const startTime = this.formatTime(record.startTime);
            const endTime = this.formatTime(record.endTime);
            const totalHours = Math.floor(record.totalHours);
            const totalMinutes = Math.floor((record.totalHours - totalHours) * 60);
            
            const workType = this.getWorkTypeTextForSummary(record.leaveHours);
            
            console.log(`${dateKey}: ${startTime} ~ ${endTime} (${totalHours}시간 ${totalMinutes}분, ${workType})`);
        });
        
        // 주간 통계
        this.showWeeklyStats();
    }
    
    showWeeklyStats() {
        console.log('\n=== 이번 주 통계 ===');
        const history = this.getWorkHistory();
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // 이번 주 일요일
        
        let weeklyHours = 0;
        let workDays = 0;
        
        Object.keys(history).forEach(dateKey => {
            const recordDate = new Date(dateKey);
            if (recordDate >= weekStart && recordDate <= today) {
                weeklyHours += record.totalHours;
                workDays++;
            }
        });
        
        console.log(`근무일수: ${workDays}일`);
        console.log(`총 근무시간: ${Math.floor(weeklyHours)}시간 ${Math.floor((weeklyHours - Math.floor(weeklyHours)) * 60)}분`);
        console.log(`평균 근무시간: ${workDays > 0 ? (weeklyHours / workDays).toFixed(1) : 0}시간`);
    }
    
    loadWorkData() {
        const savedData = localStorage.getItem('workTimeData');
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                // 데이터 무결성 검증
                if (!this.validateWorkData(data)) {
                    console.warn('저장된 데이터가 유효하지 않습니다. 초기화합니다.');
                    this.resetData();
                    return;
                }
                
                this.workData = {
                    ...data,
                    startTime: data.startTime ? new Date(data.startTime) : null,
                    endTime: data.endTime ? new Date(data.endTime) : null,
                    calculatedEndTime: data.calculatedEndTime ? new Date(data.calculatedEndTime) : null
                };
                
                // 오늘 날짜가 아니면 데이터 초기화
                const today = new Date().toDateString();
                const startDate = this.workData.startTime ? this.workData.startTime.toDateString() : null;
                
                if (startDate && startDate !== today) {
                    // 다른 날짜의 데이터는 완전 초기화 (이력은 별도로 저장되어 있음)
                    this.resetData();
                } else {
                    // 오늘 데이터가 있으면 UI 상태 복원
                    this.restoreUIState();
                }
            } catch (error) {
                console.error('데이터 로드 중 오류:', error);
                this.resetData();
            }
        } else {
            // 저장된 데이터가 없어도 이력은 표시
            this.updateHistorySectionVisibility();
            
            // workHistory에서 오늘 데이터 확인
            const today = new Date().toDateString();
            const todayRecord = this.workHistory[today];
            
            if (todayRecord) {
                // workHistory에 오늘 데이터가 있으면 복원
                this.workData.startTime = todayRecord.startTime;
                this.workData.endTime = todayRecord.endTime;
                this.workData.leaveHours = todayRecord.leaveHours;
                this.workData.isWorking = false;
                this.showWorkSummary();
            }
        }
    }
    
    // 데이터 무결성 검증 메서드 추가
    validateWorkData(data) {
        // 필수 필드 존재 확인
        const requiredFields = ['startTime', 'endTime', 'leaveHours', 'isWorking'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                return false;
            }
        }
        
        // leaveHours가 유효한 값인지 확인
        if (typeof data.leaveHours !== 'number' || data.leaveHours < 0 || data.leaveHours > 4) {
            return false;
        }
        
        // isWorking이 boolean인지 확인
        if (typeof data.isWorking !== 'boolean') {
            return false;
        }
        
        return true;
    }
    
    restoreUIState() {
        if (this.workData.isWorking) {
            // 근무 중인 상태로 복원
            this.elements.statusText.textContent = '근무 중';
            this.elements.statusIndicator.className = 'status-indicator on-duty';
            
            this.elements.timeInfo.style.display = 'grid';
            this.elements.leaveOptions.style.display = 'block';
            this.elements.workSummary.style.display = 'none';
            
            // 휴가 옵션 버튼 상태 복원
            this.updateLeaveButtonStates(this.workData.leaveHours || 0);
            
            // 퇴근 버튼 상태 업데이트
            this.updateWorkButtonState();
        } else {
            // 퇴근한 상태로 복원
            this.elements.workBtn.textContent = '다시 출근';
            this.elements.workBtn.disabled = false;
            this.elements.workBtn.style.opacity = '1';
            this.elements.workBtn.style.cursor = 'pointer';
            
            this.elements.statusText.textContent = '퇴근 완료';
            this.elements.statusIndicator.className = 'status-indicator off-duty';
            
            this.elements.timeInfo.style.display = 'none';
            this.elements.leaveOptions.style.display = 'none';
            
            // 근무 요약 표시 (퇴근한 상태라면)
            if (this.workData.startTime && this.workData.endTime) {
                this.showWorkSummary();
            } else {
                // endTime이 없는 경우 - workHistory에서 오늘 데이터 확인
                const today = new Date().toDateString();
                const todayRecord = this.workHistory[today];
                if (todayRecord) {
                    // workHistory에 오늘 데이터가 있으면 복원
                    this.workData.startTime = todayRecord.startTime;
                    this.workData.endTime = todayRecord.endTime;
                    this.workData.leaveHours = todayRecord.leaveHours;
                    this.workData.isWorking = false;
                    this.showWorkSummary();
                } else {
                    // 데이터가 없으면 초기화
                    this.resetData();
                }
            }
        }
    }
    
    resetData() {
        this.workData = {
            startTime: null,
            endTime: null,
            calculatedEndTime: null,
            leaveHours: 0,
            isWorking: false
        };
        localStorage.removeItem('workTimeData');
    }

    updateWorkButtonState() {
        if (!this.workData.isWorking || !this.workData.startTime) return;
        
        const now = new Date();
        const elapsed = now - this.workData.startTime;
        const elapsedHours = elapsed / (1000 * 60 * 60);
        
        const totalRequiredHours = this.calculateRequiredHours(this.workData.leaveHours);
        
        if (elapsedHours >= totalRequiredHours) {
            // 근무시간 충족 - 퇴근 버튼 활성화
            this.elements.workBtn.disabled = false;
            this.elements.workBtn.style.opacity = '1';
            this.elements.workBtn.style.cursor = 'pointer';
            this.elements.workBtn.textContent = '퇴근하기';
        } else {
            // 근무시간 미충족 - 퇴근 버튼 비활성화
            this.elements.workBtn.disabled = true;
            this.elements.workBtn.style.opacity = '0.5';
            this.elements.workBtn.style.cursor = 'not-allowed';
            
            // 남은 시간 계산
            const remainingHours = totalRequiredHours - elapsedHours;
            const remainingHoursInt = Math.floor(remainingHours);
            const remainingMinutesInt = Math.floor((remainingHours - remainingHoursInt) * 60);
            
            if (remainingHoursInt > 0) {
                this.elements.workBtn.textContent = `퇴근까지 ${remainingHoursInt}시간 ${remainingMinutesInt}분`;
            } else {
                this.elements.workBtn.textContent = `퇴근까지 ${remainingMinutesInt}분`;
            }
        }
    }

    openEditTimeModal() {
        if (!this.workData.startTime) return;
        
        // 현재 출근시간으로 입력값 설정
        const startTime = this.workData.startTime;
        this.elements.editHour.value = startTime.getHours();
        this.elements.editMinute.value = startTime.getMinutes();
        
        this.elements.editTimeModal.style.display = 'flex';
        this.elements.editHour.focus();
    }
    
    closeEditTimeModal() {
        this.elements.editTimeModal.style.display = 'none';
    }
    
    confirmEditTime() {
        const hour = parseInt(this.elements.editHour.value);
        const minute = parseInt(this.elements.editMinute.value);
        
        // 입력값 검증
        if (isNaN(hour) || hour < 0 || hour > 23) {
            alert('시는 0-23 사이의 숫자여야 합니다.');
            return;
        }
        if (isNaN(minute) || minute < 0 || minute > 59) {
            alert('분은 0-59 사이의 숫자여야 합니다.');
            return;
        }
        
        // 출근시간 수정
        const newStartTime = new Date(this.workData.startTime);
        const originalDate = newStartTime.toDateString();
        newStartTime.setHours(hour, minute, 0, 0);
        
        // 날짜가 변경되는 경우 확인
        if (newStartTime.toDateString() !== originalDate) {
            if (!confirm('출근시간을 수정하면 날짜가 변경됩니다. 계속하시겠습니까?')) {
                return;
            }
        }
        
        this.workData.startTime = newStartTime;
        
        this.closeEditTimeModal();
        this.saveWorkData();
        this.updateDisplay();
        this.updateWorkButtonState();
        
        // 수정 완료 알림
        alert('출근시간이 수정되었습니다.');
    }

    showWorkSummary() {
        if (!this.workData.startTime || !this.workData.endTime) {
            return;
        }
        
        // 요약 데이터 설정
        this.elements.summaryStartTime.textContent = this.formatTime(this.workData.startTime);
        this.elements.summaryEndTime.textContent = this.formatTime(this.workData.endTime);
        
        // 총 근무 시간 계산
        const totalTime = this.workData.endTime - this.workData.startTime;
        const totalHours = Math.floor(totalTime / (1000 * 60 * 60));
        const totalMinutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        this.elements.summaryTotalTime.textContent = `${totalHours}시간 ${totalMinutes}분`;
        
        // 근무 형태 설정
        this.elements.summaryWorkType.textContent = this.getWorkTypeTextForSummary(this.workData.leaveHours);
        
        // 초과근무 시간 계산 및 표시
        const totalRequiredHours = this.calculateRequiredHours(this.workData.leaveHours);
        const actualHours = totalHours + (totalMinutes / 60);
        const overtimeHours = actualHours - totalRequiredHours;
        
        if (overtimeHours > 0) {
            const overtimeHoursInt = Math.floor(overtimeHours);
            const overtimeMinutesInt = Math.floor((overtimeHours - overtimeHoursInt) * 60);
            this.elements.summaryOvertime.textContent = `${overtimeHoursInt}시간 ${overtimeMinutesInt}분`;
        } else {
            this.elements.summaryOvertime.textContent = '0시간 0분';
        }
        
        if (overtimeHours > 0.5) { // 30분(0.5시간) 초과 시에만 야근으로 판정
            // 야근했음
            this.elements.summaryMessage.textContent = '내일은 칼퇴하세요! 💪';
        } else {
            // 정시 퇴근 또는 30분 이하 초과
            this.elements.summaryMessage.textContent = '오늘도 수고하셨습니다! 🎉';
        }
        
        this.elements.workSummary.style.display = 'block';
    }
    
    // 공통 유틸리티 함수들 - 중복 제거
    calculateRequiredHours(leaveHours) {
        let workHours, breakHours;
        
        if (leaveHours === 4) {
            // 반차: 휴게시간 없이 4시간만 근무
            workHours = 4;
            breakHours = 0;
        } else {
            // 정상근무 또는 반반차: 휴게시간 포함
            workHours = 8 - leaveHours;
            breakHours = 1;
        }
        
        return workHours + breakHours;
    }
    
    getWorkTypeText(leaveHours) {
        if (leaveHours === 2) return '반반차';
        if (leaveHours === 4) return '반차';
        return '정상';
    }
    
    getWorkTypeTextForSummary(leaveHours) {
        if (leaveHours === 2) return '반반차';
        if (leaveHours === 4) return '반차';
        return '정상근무';
    }
}

// API 연동을 위한 클래스 (향후 확장용)
class WorkTimeAPI {
    constructor() {
        this.baseURL = 'https://api.example.com'; // 실제 API URL로 변경 필요
    }
    
    async saveWorkData(data) {
        try {
            const response = await fetch(`${this.baseURL}/work-time`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API 저장 실패:', error);
            // API 실패시 로컬 저장으로 폴백
            localStorage.setItem('workTimeData', JSON.stringify(data));
        }
    }
    
    async loadWorkData() {
        try {
            const response = await fetch(`${this.baseURL}/work-time`);
            return await response.json();
        } catch (error) {
            console.error('API 로드 실패:', error);
            // API 실패시 로컬 데이터 사용
            return JSON.parse(localStorage.getItem('workTimeData') || 'null');
        }
    }
}

// 앱 초기화
let workTimeManager = null;

document.addEventListener('DOMContentLoaded', () => {
    workTimeManager = new WorkTimeManager();
});

// 페이지 언로드 시 정리 작업
window.addEventListener('beforeunload', () => {
    if (workTimeManager) {
        workTimeManager.destroy();
    }
}); 
