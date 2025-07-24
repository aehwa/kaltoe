class WorkTimeManager {
    constructor() {
        this.workData = {
            startTime: null,
            endTime: null,
            leaveHours: 0,
            isWorking: false
        };
        
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
            confirmEditBtn: document.getElementById('confirmEditBtn')
        };
        
        this.elapsedTimer = null;
        this.init();
    }
    
    init() {
        this.updateCurrentDate();
        this.loadWorkData();
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
        this.elements.currentDate.textContent = now.toLocaleDateString('ko-KR', options);
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
        this.workData.startTime = new Date();
        this.workData.isWorking = true;
        this.workData.leaveHours = 0; // 기본값: 정상근무
        
        this.elements.workBtn.textContent = '퇴근하기';
        this.elements.statusText.textContent = '근무 중';
        this.elements.statusIndicator.className = 'status-indicator on-duty';
        
        this.elements.timeInfo.style.display = 'grid';
        this.elements.leaveOptions.style.display = 'block';
        
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
        
        this.elements.elapsedTime.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 경과 시간이 업데이트될 때마다 퇴근 버튼 상태 확인
        if (this.workData.isWorking) {
            this.updateWorkButtonState();
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
            
            // 오늘 날짜가 아니면 데이터 초기화
            const today = new Date().toDateString();
            const startDate = this.workData.startTime ? this.workData.startTime.toDateString() : null;
            
            if (startDate && startDate !== today) {
                this.resetData();
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
            
            // 휴가 옵션 버튼 상태 복원 (기본값: 정상근무)
            document.querySelectorAll('.leave-btn').forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.dataset.hours) === (this.workData.leaveHours || 0)) {
                    btn.classList.add('active');
                }
            });
            
            // 출근 기록 추가
            if (this.workData.startTime) {
                // this.addHistory('출근', this.workData.startTime); // Removed
            }
            
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
            
            // 출근/퇴근 기록 추가
            if (this.workData.startTime) {
                // this.addHistory('출근', this.workData.startTime); // Removed
            }
            if (this.workData.endTime) {
                // this.addHistory('퇴근', this.workData.endTime); // Removed
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
        // this.elements.historyList.innerHTML = ''; // Removed
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
            
            // 남은 시간 계산
            const remainingHours = totalRequiredHours - elapsedHours;
            const remainingMinutes = Math.ceil(remainingHours * 60);
            this.elements.workBtn.textContent = `퇴근까지 ${Math.floor(remainingMinutes / 60)}시간 ${remainingMinutes % 60}분`;
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
            alert('시간은 0-23 사이의 숫자여야 합니다.');
            return;
        }
        if (isNaN(minute) || minute < 0 || minute > 59) {
            alert('분은 0-59 사이의 숫자여야 합니다.');
            return;
        }
        
        // 출근시간 수정
        const newStartTime = new Date(this.workData.startTime);
        newStartTime.setHours(hour, minute, 0, 0);
        
        this.workData.startTime = newStartTime;
        
        this.closeEditTimeModal();
        this.saveWorkData();
        this.updateDisplay();
        this.updateWorkButtonState();
        
        // 수정 완료 알림
        alert('출근시간이 수정되었습니다.');
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