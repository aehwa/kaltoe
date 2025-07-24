class WorkTimeManager {
    constructor() {
        this.workData = {
            startTime: null,
            endTime: null,
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
            summaryMessage: document.getElementById('summaryMessage'),
            historyList: document.getElementById('historyList')
        };
        
        this.elapsedTimer = null;
        this.init();
    }
    
    init() {
        this.updateCurrentDate();
        this.loadWorkData();
        this.loadWorkHistory(); // 근무 이력 로드 추가
        this.setupEventListeners();
        this.updateDisplay();
        this.startElapsedTimer();
        
        // 1초마다 현재 날짜 업데이트
        setInterval(() => this.updateCurrentDate(), 1000);
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
            document.querySelectorAll('.leave-btn').forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.dataset.hours) === (this.workData.leaveHours || 0)) {
                    btn.classList.add('active');
                }
            });
            
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
        document.querySelectorAll('.leave-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.hours) === 0) {
                btn.classList.add('active');
            }
        });
        
        this.saveWorkData();
        this.updateDisplay();
        this.updateWorkButtonState();
    }
    
    endWork() {
        this.workData.endTime = new Date();
        this.workData.isWorking = false;
        
        this.elements.workBtn.textContent = '출근하기';
        this.elements.statusText.textContent = '출근 전';
        this.elements.statusIndicator.className = 'status-indicator off-duty';
        
        this.elements.timeInfo.style.display = 'none';
        this.elements.leaveOptions.style.display = 'none';
        
        // 근무 요약 표시
        this.showWorkSummary();
        
        this.saveWorkData();
        this.updateDisplay();
        
        // 타이머 정지
        if (this.elapsedTimer) {
            clearInterval(this.elapsedTimer);
            this.elapsedTimer = null;
        }
    }
    
    selectLeaveOption(hours) {
        this.workData.leaveHours = hours;
        
        // 버튼 활성화 상태 업데이트
        document.querySelectorAll('.leave-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.hours) === hours) {
                btn.classList.add('active');
            }
        });
        
        this.saveWorkData();
        this.updateDisplay();
        this.updateWorkButtonState();
    }
    
    updateDisplay() {
        if (this.workData.startTime) {
            this.elements.startTime.textContent = this.formatTime(this.workData.startTime);
            this.updateElapsedTime();
            this.updateEndTime();
        }
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
            
            // 경과 시간이 업데이트될 때마다 퇴근 버튼 상태와 남은 시간 확인
            if (this.workData.isWorking) {
                this.updateWorkButtonState();
                // 예상 퇴근시간 다시 계산하여 남은 시간 업데이트
                this.updateEndTime();
            }
        }
    }
    
    updateEndTime() {
        if (!this.workData.startTime) return;
        
        // 근무시간과 휴게시간 계산
        let workHours, breakHours;
        
        if (this.workData.leaveHours === 4) {
            // 반차: 휴게시간 없이 4시간만 근무
            workHours = 4;
            breakHours = 0;
        } else {
            // 정상근무 또는 반반차: 휴게시간 포함
            workHours = 8 - this.workData.leaveHours;
            breakHours = 1;
        }
        
        const totalRequiredHours = workHours + breakHours;
        
        const endTime = new Date(this.workData.startTime);
        endTime.setHours(endTime.getHours() + totalRequiredHours);
        
        this.elements.endTime.textContent = this.formatTime(endTime);
        
        // 남은 시간 계산 및 표시
        this.updateRemainingTime(endTime);
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
        let shouldShow = true;
        
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
        this.elapsedTimer = setInterval(() => {
            if (this.workData.isWorking) {
                this.updateElapsedTime();
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
        const dataToSave = {
            ...this.workData,
            startTime: this.workData.startTime ? this.workData.startTime.toISOString() : null,
            endTime: this.workData.endTime ? this.workData.endTime.toISOString() : null
        };
        
        localStorage.setItem('workTimeData', JSON.stringify(dataToSave));
        
        // 근무 이력도 함께 저장
        this.saveWorkHistory();
    }
    
    saveWorkHistory() {
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
    }
    
    loadWorkHistory() {
        const savedHistory = localStorage.getItem('workHistory');
        if (savedHistory) {
            this.workHistory = JSON.parse(savedHistory);
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
            
            let workType = '정상근무';
            if (record.leaveHours === 2) workType = '반반차';
            else if (record.leaveHours === 4) workType = '반차';
            
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
            const data = JSON.parse(savedData);
            this.workData = {
                ...data,
                startTime: data.startTime ? new Date(data.startTime) : null,
                endTime: data.endTime ? new Date(data.endTime) : null
            };
            
            // 오늘 날짜가 아니면 데이터 초기화 (단, 퇴근 완료된 데이터는 유지)
            const today = new Date().toDateString();
            const startDate = this.workData.startTime ? this.workData.startTime.toDateString() : null;
            
            if (startDate && startDate !== today) {
                // 퇴근이 완료된 경우 근무 요약은 유지
                if (this.workData.endTime) {
                    this.workData.isWorking = false;
                    this.workData.startTime = null; // 출근시간만 초기화
                    this.workData.leaveHours = 0;
                    this.saveWorkData();
                    this.restoreUIState();
                } else {
                    // 퇴근하지 않은 경우 완전 초기화
                    this.resetData();
                }
            } else {
                // 저장된 데이터가 있으면 UI 상태 복원
                this.restoreUIState();
            }
        }
    }
    
    restoreUIState() {
        if (this.workData.isWorking) {
            // 근무 중인 상태로 복원
            this.elements.statusText.textContent = '근무 중';
            this.elements.statusIndicator.className = 'status-indicator on-duty';
            
            this.elements.timeInfo.style.display = 'grid';
            this.elements.leaveOptions.style.display = 'block';
            this.elements.workSummary.style.display = 'none';
            
            // 휴가 옵션 버튼 상태 복원 (기본값: 정상근무)
            document.querySelectorAll('.leave-btn').forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.dataset.hours) === (this.workData.leaveHours || 0)) {
                    btn.classList.add('active');
                }
            });
            
            // 퇴근 버튼 상태 업데이트
            this.updateWorkButtonState();
        } else {
            // 퇴근한 상태로 복원
            this.elements.workBtn.textContent = '출근하기';
            this.elements.workBtn.disabled = false;
            this.elements.workBtn.style.opacity = '1';
            this.elements.workBtn.style.cursor = 'pointer';
            
            this.elements.statusText.textContent = '출근 전';
            this.elements.statusIndicator.className = 'status-indicator off-duty';
            
            this.elements.timeInfo.style.display = 'none';
            this.elements.leaveOptions.style.display = 'none';
            
            // 근무 요약 표시 (퇴근한 상태라면)
            if (this.workData.endTime) {
                this.showWorkSummary();
            }
        }
    }
    
    resetData() {
        this.workData = {
            startTime: null,
            endTime: null,
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
        
        // 근무시간과 휴게시간 계산
        let workHours, breakHours;
        
        if (this.workData.leaveHours === 4) {
            // 반차: 휴게시간 없이 4시간만 근무
            workHours = 4;
            breakHours = 0;
        } else {
            // 정상근무 또는 반반차: 휴게시간 포함
            workHours = 8 - this.workData.leaveHours;
            breakHours = 1;
        }
        
        const totalRequiredHours = workHours + breakHours;
        
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
            
            // 남은 시간 계산 (수정됨)
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
        if (!this.workData.startTime || !this.workData.endTime) return;
        
        // 요약 데이터 설정
        this.elements.summaryStartTime.textContent = this.formatTime(this.workData.startTime);
        this.elements.summaryEndTime.textContent = this.formatTime(this.workData.endTime);
        
        // 총 근무 시간 계산
        const totalTime = this.workData.endTime - this.workData.startTime;
        const totalHours = Math.floor(totalTime / (1000 * 60 * 60));
        const totalMinutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        this.elements.summaryTotalTime.textContent = `${totalHours}시간 ${totalMinutes}분`;
        
        // 근무 형태 설정
        let workType = '정상근무';
        if (this.workData.leaveHours === 2) workType = '반반차';
        else if (this.workData.leaveHours === 4) workType = '반차';
        this.elements.summaryWorkType.textContent = workType;
        
        // 메시지 설정
        let requiredHours;
        if (this.workData.leaveHours === 4) {
            requiredHours = 4; // 반차: 4시간 (휴게시간 없음)
        } else if (this.workData.leaveHours === 2) {
            requiredHours = 7; // 반반차: 6시간 근무 + 1시간 휴게
        } else {
            requiredHours = 9; // 정상근무: 8시간 근무 + 1시간 휴게
        }
        
        const actualHours = totalHours + (totalMinutes / 60);
        const overtimeHours = actualHours - requiredHours;
        
        if (overtimeHours > 0.5) { // 30분(0.5시간) 초과 시에만 야근으로 판정
            // 야근했음
            this.elements.summaryMessage.textContent = '내일은 칼퇴하세요! 💪';
        } else {
            // 정시 퇴근 또는 30분 이하 초과
            this.elements.summaryMessage.textContent = '오늘도 수고하셨습니다! 🎉';
        }
        
        this.elements.workSummary.style.display = 'block';
        
        // 이전 근무 기록 표시
        this.showWorkHistoryInUI();
    }
    
    showWorkHistoryInUI() {
        const history = this.getWorkHistory();
        const historyList = this.elements.historyList;
        
        // 기존 내용 초기화
        historyList.innerHTML = '';
        
        if (Object.keys(history).length === 0) {
            historyList.innerHTML = '<div class="no-history">저장된 근무 기록이 없습니다.</div>';
            return;
        }
        
        // 최근 7일간의 기록만 표시 (최신순)
        const sortedDates = Object.keys(history).sort().reverse().slice(0, 7);
        
        sortedDates.forEach(dateKey => {
            const record = history[dateKey];
            const startTime = this.formatTime(record.startTime);
            const endTime = this.formatTime(record.endTime);
            const totalHours = Math.floor(record.totalHours);
            const totalMinutes = Math.floor((record.totalHours - totalHours) * 60);
            
            let workType = '정상';
            if (record.leaveHours === 2) workType = '반반차';
            else if (record.leaveHours === 4) workType = '반차';
            
            // 날짜 포맷팅 (월/일)
            const date = new Date(dateKey);
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-date">${formattedDate}</div>
                <div class="history-time">${startTime} ~ ${endTime}</div>
                <div class="history-duration">${totalHours}h ${totalMinutes}m</div>
                <div class="history-type">${workType}</div>
            `;
            
            historyList.appendChild(historyItem);
        });
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
document.addEventListener('DOMContentLoaded', () => {
    new WorkTimeManager();
}); 
