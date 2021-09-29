let SERVER_URL;
let CHAT_URL;
let mediaControlUrl;
let LMS_URL;
let socket;

let isMobile;
let managerId;
let userId;
let userNick;
let userLevel;
let viewType;
let tokenUserType;
let lectureData;	// 강의정보
let studentList;	// 학생정보 or 학생정보리스트 JSON Array

let opaqueId;
let roomNo;
let janus;
let onlocal;
let doSimulcast;
let doSimulcast2;
let bitrate;
let share;
let feeds = [];
let fStream = [];

let mypvtid;
let myStream;
let videoElement;
let audioInTest;
let audioOutTest;
let inMeter;
let outMeter;
let createHtml;

let videoSelect;
let audioInputSelect;
let audioOutputSelect;
let speakerSelectValue;
let audioSelectValue;
let videoSelectValue;
let videoRevValue;
let toggleAudioVal = 'OFF';

const laViewCnt = 16;
const liViewCnt = 5;
let pageViewCnt;
let maxMemCnt;
let totalPage;
let currPageNo;
let iframeMode = "cam";
let popupMode = "cam";
let mode = "cam";

let date;
let nowHours;
let nowMinutes;
let renewalSeconds;
let nowSeconds;
let nowTime;
let isAmPm = '오전';

let yesTimeout, noTimeout;

let heightProc;
let selIdx = 1;
let videoRev = false;
let confVieoTrue = {request: "configure", video: true, audio: true}
let confVieoFalse = {request: "configure", video: false, audio: true}

let toStudentID;
let toStudentNick;
let toStudentLevel;
let joinNext = false;
let uChatCnt = [];
let sh;
let seq=0;
let userType;
let audioElement = new Audio();

let qnaStdRow = 5;
let qnaStdCnt = 0;
let qnaStdElm = [];
let qnaStdIdx;
let nextqIdx;
let newAcceptData;
// Y : 질문 중
// N : 질문 대기중
// C : 학생이 질문 취소
// F : 질문 종료
let questionCheck = 'N';


// 이해했어요 / 이해안됐어요
let understandCount = 0;
let misUnderstandCount = 0;
let understandTotalCount = 0;
let misUnderstandTotalCount = 0;

// 질문
let data;
let closeBtnId;

//타이머
let totalSec = 0;
let hour = 0;
let min = 0;
let sec = 0;
let startTimer;
let examRemainTimer;
let QCoolTimer;
let QPossibleYN = true;

// 경고
let wdata;
let count = 1;
let nowStdWarnStatus = [];
//let eachCnt = 0;

//수업중 퇴장
let offTmp = { drop : '', startSetTime:  '',  reEnter: '' };

// 5분 이탈
let exitCheckTimer;

// 현재 접속중인 학생수
let currStudentCnt = 0;

// 조교가 처음 입장했을때 상태를 판단하기위한 flag
let isFirstJoin = false;

// 최초 학생 본임 캠의 너비
let selfCamWidth;

// room 비디오 오디오 코텍
let room_audio_codec;
let room_video_codec;
let aqstudent_id;
let aqstudent_idx;

// 채팅히스토리 시퀀스
let seqHisChatCheck = 0;

// createoffer 에러 수
let coErrorCnt = 0;

// 학생 전체화면 플래그 값
let fullscrenFlag = false;
// 학생 전체화면에서 받은 채팅 수
let fullscrenChatCnt = 0;

if( navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i)) {
	isMobile = true;
}

function joinRoom() {
    let str_crt = {
        MEETING_CODE: roomNo,
        ID: userId,
        NICK: userNick,
        LEVEL: userLevel
    };
    socket.emit('req-join-meeting', str_crt);
    // console.log('요청 : req-join-meeting');
	emitStopwatch(roomNo, 'R', '');
}

function refreshChat() {
    let str_crt = {
        MEETING_CODE: roomNo
    };
    socket.emit('refresh-ChatMsg', str_crt);
    // console.log('요청 : refresh-ChatMsg');
}

function lectureStart() {
    // console.log('요청 : notify-Lecture-start');
    socket.emit("notify-Lecture-start",{});
}

// Helper to parse query string
function getQueryStringValue(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function bitRateTxt(bitRate) {
	if(bitRate === undefined || bitRate <= 0) {
		bitRate = '0.0M';
	} else {
		bitRate = parseFloat(bitRate/1024).toFixed(1);
		bitRate = bitRate+'M';
	}
	return bitRate;
}

// 학생입장에서 강사캠과 본인캠 정상작동하는지 확인
function CamOperConfirm(type){
    let result = false;
    if( ($('#teacher_main').children().length < 1) || ($('#video_cam').css("display") == "none") ){
        result = true;
        if(type == 'question'){
            alert("질의응답을 할 수 없습니다\n(카메라꺼짐)");
        }

        if(type == 'chat'){
            alert("채팅기능을 사용할 수 없습니다\n(카메라꺼짐)");
        }
    }
    return result;
}

// 시간
function showNowTime(){
	let retHours;
	date = new Date();
	nowHours = date.getHours() > 12 ? "0"+( date.getHours() - 12 ) : date.getHours();
	retHours = nowHours;
	if(date.getHours() >= 12 && date.getHours() < 24){
		isAmPm='오후';
		if(nowHours.length >2){
            nowHours = nowHours.substring(1,3);
        }
		retHours = parseInt(nowHours)+12;
	}
	nowMinutes = date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes();
	nowSeconds = date.getSeconds() < 10 ? "0"+date.getSeconds() : date.getSeconds();
	renewalSeconds = 60 - date.getSeconds();
	$("#time").text(isAmPm+" "+nowHours+":"+nowMinutes);
	return retHours+""+nowMinutes+""+nowSeconds;
}
function showTimeInterval(){
	showNowTime();
	setInterval(showNowTime,1000);
}

function isNull (value, changeStr) {
  let bReturn = false

  if (value === undefined || value === null || value === '' || value === 'null' || value === 'undefined') {
    bReturn = true
  }

  if (undefined !== changeStr && changeStr !== null) {
    if (bReturn) {
      return changeStr
    }

    return value
  }

  return bReturn
}

/**
 * HTML Decode
 *
 * @param {String} str 디코딩 대상 HTML
 * @returns {String} 디코딩된 HTML
 */
function htmlDecode (str) {
  if (typeof str !== 'string') {
    return
  }

  let strReturn = String(str)
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')

  if (strReturn.includes('&gt;') ||
  strReturn.includes('&lt;') ||
  strReturn.includes('&#39;') ||
  strReturn.includes('&quot;') ||
  strReturn.includes('&amp;')) {
    strReturn = replaceAll(strReturn, '&gt;', '>')
    strReturn = replaceAll(strReturn, '&lt;', '<')
    strReturn = replaceAll(strReturn, '&#39;', "'")
    strReturn = replaceAll(strReturn, '&quot;', '"')
    strReturn = replaceAll(strReturn, '&amp;', '&')
  }
  return strReturn
}

//숫자 프로토타입으로 입력 길이만큼 앞에 0을 채운 문자열 반환
Number.prototype.leftFillZero = function(width){
    let n = String(this);//문자열 변환
    return n.length >= width ? n:new Array(width-n.length+1).join('0')+n;//남는 길이만큼 0으로 채움
}

Number.prototype.rightFillZero = function(width){
    let n = String(this);//문자열 변환
    return n+(n.length >= width ? n:new Array(width-n.length+1).join('0'));//남는 길이만큼 0으로 채움
}

function leftFillZero(width, str){
    return str.length >= width ? str:new Array(width-str.length+1).join('0')+str;//남는 길이만큼 0으로 채움
}

function rightFillZero(width, str){
    return str + (str.length >= width ? str:new Array(width-str.length+1).join('0'));//남는 길이만큼 0으로 채움
}